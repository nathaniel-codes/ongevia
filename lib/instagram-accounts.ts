import { prisma } from "@/lib/db/client";
import { hasIgUsernameShareUnlock } from "@/lib/instagram-username";
import { platformIgUsername } from "@/lib/platform-ig";

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
  const preferred = platformIgUsername();

  const shared = await prisma.instagramAccount.findFirst({
    where: { isPlatformShared: true },
    orderBy: { connectedAt: "desc" },
  });
  if (shared) {
    // Keep the Instagram username Meta reports — do not overwrite with env alias.
    return shared;
  }

  return prisma.instagramAccount.findFirst({
    where: { username: { equals: preferred, mode: "insensitive" } },
    orderBy: { connectedAt: "desc" },
  });
}

/** Accounts the workspace can use for campaigns: own + platform shared page. */
export async function listInstagramAccountsForWorkspace(workspaceId: string) {
  const [own, platform] = await Promise.all([
    prisma.instagramAccount.findMany({
      where: { workspaceId },
      orderBy: { connectedAt: "desc" },
    }),
    getPlatformSharedAccount(),
  ]);

  if (
    !platform ||
    !platform.isPlatformShared ||
    platform.workspaceId === workspaceId
  ) {
    return own;
  }

  return [...own, platform];
}

/**
 * Collaborate is on by default for every workspace when the shared page exists.
 * Still writes the legacy setting so older checks stay consistent.
 */
export async function ensureWorkspaceCollaborating(
  workspaceId: string
): Promise<{
  collaborating: boolean;
  platform: Awaited<ReturnType<typeof getPlatformSharedAccount>>;
}> {
  const platform = await getPlatformSharedAccount();
  if (!platform?.isPlatformShared) {
    return { collaborating: false, platform: null };
  }

  if (platform.workspaceId === workspaceId) {
    return { collaborating: true, platform };
  }

  await prisma.platformSetting.upsert({
    where: { key: `workspace:${workspaceId}:collaborate` },
    create: {
      key: `workspace:${workspaceId}:collaborate`,
      value: platform.id,
    },
    update: { value: platform.id },
  });

  return { collaborating: true, platform };
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
    if (account) {
      if (account.isPlatformShared && account.workspaceId !== workspaceId) {
        await ensureWorkspaceCollaborating(workspaceId);
      }
      return account;
    }

    const platform = await getPlatformSharedAccount();
    if (platform?.id === instagramAccountId) {
      await ensureWorkspaceCollaborating(workspaceId);
      return platform;
    }
    return null;
  }

  // Prefer the workspace's own account, else the shared collaborate page.
  const own = await prisma.instagramAccount.findFirst({
    where: { workspaceId },
    orderBy: { connectedAt: "desc" },
  });
  if (own) return own;

  const { collaborating, platform } =
    await ensureWorkspaceCollaborating(workspaceId);
  if (collaborating && platform) return platform;
  return null;
}
