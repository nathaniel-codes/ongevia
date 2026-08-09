import { prisma } from "@/lib/db/client";
import { adjustWallet } from "@/lib/wallet";

/** Cost in credits (1:1 TZS) to use a display name already taken by another user. */
export const NAME_SHARE_COST_TZS = 5000;

export function normalizeDisplayName(input: string): string {
  return input.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function nameKeyFromDisplayName(name: string): string | null {
  const normalized = normalizeDisplayName(name);
  if (normalized.length < 2) return null;
  return normalized.toLowerCase();
}

/**
 * Ensures a display name is free, or charges NAME_SHARE_COST_TZS to share it.
 * New signups cannot pay-to-share (no wallet yet) — they must pick a unique name.
 */
export async function assertDisplayNameAvailable(params: {
  name: string;
  userId?: string | null;
  payToShare?: boolean;
}): Promise<
  | { ok: true; name: string; nameKey: string; charged: boolean }
  | { ok: false; error: string; code: "taken" | "invalid" | "insufficient" }
> {
  const name = normalizeDisplayName(params.name);
  const nameKey = nameKeyFromDisplayName(name);
  if (!nameKey) {
    return {
      ok: false,
      error: "Enter a name (at least 2 characters).",
      code: "invalid",
    };
  }

  const existing = await prisma.user.findFirst({
    where: {
      nameKey,
      ...(params.userId ? { id: { not: params.userId } } : {}),
    },
    select: { id: true, name: true },
  });

  if (!existing) {
    return { ok: true, name, nameKey, charged: false };
  }

  if (!params.payToShare || !params.userId) {
    return {
      ok: false,
      error: `“${existing.name ?? name}” is already taken. Choose another name, or top up and pay ${NAME_SHARE_COST_TZS.toLocaleString()} TZS from Settings to use it on this account too.`,
      code: "taken",
    };
  }

  try {
    await adjustWallet({
      userId: params.userId,
      amount: -NAME_SHARE_COST_TZS,
      type: "ADMIN_DEBIT",
      reference: `name_share:${nameKey}`,
      note: `Display name share — ${NAME_SHARE_COST_TZS} TZS`,
      actorUserId: params.userId,
    });
  } catch {
    return {
      ok: false,
      error: `Need ${NAME_SHARE_COST_TZS.toLocaleString()} credits to reuse this name. Top up your wallet first.`,
      code: "insufficient",
    };
  }

  return { ok: true, name, nameKey, charged: true };
}
