import { prisma } from "@/lib/db/client";
import { adjustWallet } from "@/lib/wallet";

/** Cost to connect an Instagram username already linked to another workspace. */
export const IG_USERNAME_SHARE_COST_TZS = 5000;

export function normalizeIgUsername(input: string): string {
  return input.trim().replace(/^@/, "").toLowerCase();
}

function shareUnlockKey(workspaceId: string, username: string): string {
  return `ig_username_share:${workspaceId}:${normalizeIgUsername(username)}`;
}

export async function hasIgUsernameShareUnlock(
  workspaceId: string,
  username: string
): Promise<boolean> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: shareUnlockKey(workspaceId, username) },
  });
  return Boolean(row?.value);
}

/**
 * Charge the workspace owner so this workspace may connect an IG username
 * that is already used on another workspace.
 */
export async function purchaseIgUsernameShare(params: {
  workspaceId: string;
  username: string;
  actorUserId: string;
}): Promise<
  | { ok: true; charged: number }
  | { ok: false; error: string; code: "invalid" | "insufficient" | "not_needed" }
> {
  const username = normalizeIgUsername(params.username);
  if (!username) {
    return { ok: false, error: "Invalid Instagram username.", code: "invalid" };
  }

  if (await hasIgUsernameShareUnlock(params.workspaceId, username)) {
    return { ok: false, error: "Already unlocked for this workspace.", code: "not_needed" };
  }

  const taken = await prisma.instagramAccount.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
      workspaceId: { not: params.workspaceId },
      isPlatformShared: false,
    },
    select: { id: true, username: true },
  });
  if (!taken) {
    return {
      ok: false,
      error: "That Instagram username is not taken by another workspace.",
      code: "not_needed",
    };
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    select: { ownerId: true },
  });
  if (!workspace) {
    return { ok: false, error: "Workspace not found.", code: "invalid" };
  }

  try {
    await adjustWallet({
      userId: workspace.ownerId,
      amount: -IG_USERNAME_SHARE_COST_TZS,
      type: "ADMIN_DEBIT",
      reference: `ig_share:${username}`,
      note: `Instagram @${username} share — ${IG_USERNAME_SHARE_COST_TZS} TZS`,
      actorUserId: params.actorUserId,
    });
  } catch {
    return {
      ok: false,
      error: `Need ${IG_USERNAME_SHARE_COST_TZS.toLocaleString()} credits to use @${username} on this workspace too.`,
      code: "insufficient",
    };
  }

  await prisma.platformSetting.upsert({
    where: { key: shareUnlockKey(params.workspaceId, username) },
    create: {
      key: shareUnlockKey(params.workspaceId, username),
      value: String(Date.now()),
    },
    update: { value: String(Date.now()) },
  });

  return { ok: true, charged: IG_USERNAME_SHARE_COST_TZS };
}
