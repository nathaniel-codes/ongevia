import { prisma } from "@/lib/db/client";
import type { Prisma, WalletTransactionType } from "@/app/generated/prisma/client";
import { logAction } from "@/lib/action-log";

export async function getSignupBonusCredits(): Promise<number> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "SIGNUP_BONUS_CREDITS" },
  });
  if (setting) {
    const n = Number(setting.value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  const env = Number(process.env.SIGNUP_BONUS_CREDITS ?? "1000");
  return Number.isFinite(env) && env >= 0 ? env : 1000;
}

/** Create wallet if missing. On first create, optionally grant signup bonus. */
export async function ensureWallet(
  userId: string,
  options?: { grantSignupBonus?: boolean }
) {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;

  const bonus = options?.grantSignupBonus ? await getSignupBonusCredits() : 0;

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.create({
      data: { userId, balance: bonus },
    });
    if (bonus > 0) {
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: bonus,
          balanceAfter: wallet.balance,
          type: "ADMIN_GRANT",
          reference: "signup_bonus",
          note: `Welcome bonus — ${bonus} TZS credits`,
        },
      });
    }
    return wallet;
  });
}

export async function getCreditsPer1000Tzs(): Promise<number> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "CREDITS_PER_1000_TZS" },
  });
  if (setting) {
    const n = Number(setting.value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  // 1 credit = 1 TZS by default (1000 credits per 1000 TZS top-up)
  const env = Number(process.env.CREDITS_PER_1000_TZS ?? "1000");
  return Number.isFinite(env) && env > 0 ? env : 1000;
}

export async function getDmCreditCost(): Promise<number> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "DM_CREDIT_COST" },
  });
  if (setting) {
    const n = Number(setting.value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  // Each automated comment/reply DM costs 10 TZS (credits)
  const env = Number(process.env.DM_CREDIT_COST ?? "10");
  return Number.isFinite(env) && env >= 0 ? env : 10;
}

export function creditsForAmount(amountTzs: number, per1000: number): number {
  return Math.floor((amountTzs / 1000) * per1000);
}

export async function adjustWallet(params: {
  userId: string;
  amount: number;
  type: WalletTransactionType;
  reference?: string;
  note?: string;
  actorUserId?: string;
}): Promise<{ balance: number }> {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId: params.userId },
      create: { userId: params.userId, balance: 0 },
      update: {},
    });

    const next = wallet.balance + params.amount;
    if (next < 0) {
      throw new Error("Insufficient credits");
    }

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: next },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: params.amount,
        balanceAfter: updated.balance,
        type: params.type,
        reference: params.reference,
        note: params.note,
      },
    });

    return { balance: updated.balance };
  }).then(async (result) => {
    await logAction({
      actorUserId: params.actorUserId ?? params.userId,
      actorType: params.type.startsWith("ADMIN") ? "ADMIN" : "USER",
      action: `wallet.${params.type.toLowerCase()}`,
      entityType: "Wallet",
      entityId: params.userId,
      meta: {
        amount: params.amount,
        reference: params.reference,
        note: params.note,
        balance: result.balance,
      } as Prisma.InputJsonValue,
    });
    return result;
  });
}

/** Deduct DM credits for a workspace owner. Returns false if insufficient. */
export async function spendDmCredits(workspaceId: string): Promise<{
  allowed: boolean;
  remaining: number;
  cost: number;
}> {
  const cost = await getDmCreditCost();
  if (cost === 0) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, cost: 0 };
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!workspace) {
    return { allowed: false, remaining: 0, cost };
  }

  try {
    const { balance } = await adjustWallet({
      userId: workspace.ownerId,
      amount: -cost,
      type: "DM_SPEND",
      reference: workspaceId,
      note: "Comment/reply DM",
    });
    return { allowed: true, remaining: balance, cost };
  } catch {
    const wallet = await ensureWallet(workspace.ownerId);
    return { allowed: false, remaining: wallet.balance, cost };
  }
}

export async function refundDmCredits(workspaceId: string): Promise<void> {
  const cost = await getDmCreditCost();
  if (cost === 0) return;
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!workspace) return;
  await adjustWallet({
    userId: workspace.ownerId,
    amount: cost,
    type: "REFUND",
    reference: workspaceId,
    note: "DM send failed — refund",
  });
}
