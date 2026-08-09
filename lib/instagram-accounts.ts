import { prisma } from "@/lib/db/client";

export async function canConnectInstagramAccount({
  workspaceId,
  instagramId,
}: {
  workspaceId: string;
  instagramId: string;
}) {
  const existingAccount = await prisma.instagramAccount.findUnique({
    where: { instagramId },
    select: { workspaceId: true, isPlatformShared: true },
  });

  if (
    existingAccount &&
    existingAccount.workspaceId !== workspaceId &&
    !existingAccount.isPlatformShared
  ) {
    return {
      allowed: false,
      reason: "already_connected" as const,
    };
  }

  return {
    allowed: true,
    reason: null,
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

  // Fallback: username match (admin can connect @ongevia then we auto-detect)
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

    // Username fallback for not-yet-flagged platform account
    const platform = await getPlatformSharedAccount();
    if (platform?.id === instagramAccountId) return platform;
    return null;
  }

  return prisma.instagramAccount.findFirst({
    where: { workspaceId },
    orderBy: { connectedAt: "desc" },
  });
}
