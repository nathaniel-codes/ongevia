import { prisma } from "@/lib/db/client";
import { hasIgUsernameShareUnlock } from "@/lib/instagram-username";

export async function canConnectInstagramAccount({
  workspaceId,
  instagramId,
  username,
}: {
  workspaceId: string;
  instagramId: string;
  username?: string | null;
}) {
  const existingAccount = await prisma.instagramAccount.findUnique({
    where: { instagramId },
    select: {
      workspaceId: true,
      isPlatformShared: true,
      username: true,
    },
  });

  if (
    existingAccount &&
    existingAccount.workspaceId !== workspaceId &&
    !existingAccount.isPlatformShared
  ) {
    const unlocked = await hasIgUsernameShareUnlock(
      workspaceId,
      existingAccount.username
    );
    if (!unlocked) {
      return {
        allowed: false as const,
        reason: "already_connected" as const,
        username: existingAccount.username,
      };
    }
  }

  const igUsername = (username ?? existingAccount?.username ?? "").trim();
  if (igUsername) {
    const sameName = await prisma.instagramAccount.findFirst({
      where: {
        username: { equals: igUsername, mode: "insensitive" },
        workspaceId: { not: workspaceId },
        isPlatformShared: false,
        ...(instagramId ? { instagramId: { not: instagramId } } : {}),
      },
      select: { username: true, workspaceId: true },
    });
    if (sameName) {
      const unlocked = await hasIgUsernameShareUnlock(
        workspaceId,
        sameName.username
      );
      if (!unlocked) {
        return {
          allowed: false as const,
          reason: "username_taken" as const,
          username: sameName.username,
        };
      }
    }
  }

  return {
    allowed: true as const,
    reason: null,
    username: igUsername || null,
  };
}

export async function getPlatformSharedAccount() {
  const preferred = (process.env.PLATFORM_INSTAGRAM_USERNAME ?? "ongeviadotcom")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  const shared = await prisma.instagramAccount.findFirst({
    where: { isPlatformShared: true },
    orderBy: { connectedAt: "desc" },
  });
  if (shared) return shared;

  return prisma.instagramAccount.findFirst({
    where: { username: { equals: preferred, mode: "insensitive" } },
    orderBy: { connectedAt: "desc" },
  });
}

/** Accounts the workspace can use for campaigns: own + platform shared (if collaborating). */
export async function listInstagramAccountsForWorkspace(workspaceId: string) {
  const [own, platform, collaborate] = await Promise.all([
    prisma.instagramAccount.findMany({
      where: { workspaceId },
      orderBy: { connectedAt: "desc" },
    }),
    getPlatformSharedAccount(),
    prisma.platformSetting.findUnique({
      where: { key: `workspace:${workspaceId}:collaborate` },
    }),
  ]);

  const collaborating = Boolean(collaborate?.value);
  if (
    !platform ||
    !platform.isPlatformShared ||
    platform.workspaceId === workspaceId ||
    !collaborating
  ) {
    return own;
  }

  return [...own, platform];
}

export async function getWorkspaceInstagramAccount(
  workspaceId: string,
  instagramAccountId?: string | null
) {
  if (instagramAccountId && instagramAccountId !== "all") {
    const account = await prisma.instagramAccount.findFirst({
      where: {
        id: instagramAccountId,
        OR: [{ workspaceId }, { isPlatformShared: true }],
      },
    });
    if (account) return account;

    const platform = await getPlatformSharedAccount();
    if (platform?.id === instagramAccountId) return platform;
    return null;
  }

  return prisma.instagramAccount.findFirst({
    where: { workspaceId },
    orderBy: { connectedAt: "desc" },
  });
}
