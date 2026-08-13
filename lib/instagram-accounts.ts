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

/** @deprecated Shared collaborate page removed — always null. */
export async function getPlatformSharedAccount(): Promise<{
  id: string;
  workspaceId: string;
  instagramId: string;
  username: string;
  accessToken: string;
  isPlatformShared: boolean;
} | null> {
  return null;
}

/** @deprecated Shared collaborate mode removed. */
export async function ensureWorkspaceCollaborating(_workspaceId: string): Promise<{
  collaborating: boolean;
  platform: Awaited<ReturnType<typeof getPlatformSharedAccount>>;
}> {
  return { collaborating: false, platform: null };
}

/** Instagram accounts owned by this workspace (own connect only). */
export async function listInstagramAccountsForWorkspace(workspaceId: string) {
  return prisma.instagramAccount.findMany({
    where: { workspaceId, isPlatformShared: false },
    orderBy: { connectedAt: "desc" },
  });
}

export async function getWorkspaceInstagramAccount(
  workspaceId: string,
  instagramAccountId?: string | null
) {
  if (instagramAccountId && instagramAccountId !== "all") {
    return prisma.instagramAccount.findFirst({
      where: {
        id: instagramAccountId,
        workspaceId,
        isPlatformShared: false,
      },
    });
  }

  return prisma.instagramAccount.findFirst({
    where: { workspaceId, isPlatformShared: false },
    orderBy: { connectedAt: "desc" },
  });
}
