import { prisma } from "@/lib/db/client";
import type { Prisma } from "@/app/generated/prisma/client";
import { spendDmCredits, refundDmCredits, getDmCreditCost } from "@/lib/wallet";

function getMonthStart(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function resetUsageIfNeededTx(
  tx: Prisma.TransactionClient,
  workspaceId: string
): Promise<void> {
  const now = new Date();
  const monthStart = getMonthStart(now);

  await tx.workspace.updateMany({
    where: {
      id: workspaceId,
      usagePeriodStart: { lt: monthStart },
    },
    data: {
      usagePeriodStart: monthStart,
      dmsSentThisPeriod: 0,
    },
  });
}

export async function resetUsageIfNeeded(workspaceId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await resetUsageIfNeededTx(tx, workspaceId);
  });
}

export interface WorkspaceDMReservation {
  allowed: boolean;
  reserved: boolean;
  remaining: number;
  limit: number;
  periodStart: Date | null;
}

export async function reserveWorkspaceDMSend(
  workspaceId: string
): Promise<WorkspaceDMReservation> {
  const credit = await spendDmCredits(workspaceId);
  if (!credit.allowed) {
    return {
      allowed: false,
      reserved: false,
      remaining: credit.remaining,
      limit: credit.remaining,
      periodStart: null,
    };
  }

  return prisma.$transaction(async (tx) => {
    await resetUsageIfNeededTx(tx, workspaceId);

    const workspace = await tx.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        usagePeriodStart: true,
        dmsSentThisPeriod: true,
      },
    });

    if (!workspace) {
      await refundDmCredits(workspaceId);
      return {
        allowed: false,
        reserved: false,
        remaining: 0,
        limit: 0,
        periodStart: null,
      };
    }

    await tx.workspace.update({
      where: { id: workspaceId },
      data: { dmsSentThisPeriod: { increment: 1 } },
    });

    return {
      allowed: true,
      reserved: true,
      remaining: credit.remaining,
      limit: credit.remaining + credit.cost,
      periodStart: workspace.usagePeriodStart,
    };
  });
}

export async function canSendDMForWorkspace(workspaceId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  await resetUsageIfNeeded(workspaceId);
  const cost = await getDmCreditCost();
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!workspace) {
    return { allowed: false, remaining: 0, limit: 0 };
  }
  const wallet = await prisma.wallet.findUnique({
    where: { userId: workspace.ownerId },
  });
  const balance = wallet?.balance ?? 0;
  return {
    allowed: cost === 0 || balance >= cost,
    remaining: balance,
    limit: balance,
  };
}

export async function releaseWorkspaceDMReservation(
  workspaceId: string,
  periodStart: Date | null
) {
  await refundDmCredits(workspaceId);

  if (!periodStart) {
    return { count: 0 };
  }

  return prisma.workspace.updateMany({
    where: {
      id: workspaceId,
      usagePeriodStart: periodStart,
      dmsSentThisPeriod: { gt: 0 },
    },
    data: { dmsSentThisPeriod: { decrement: 1 } },
  });
}

export async function incrementWorkspaceDMUsage(workspaceId: string) {
  return reserveWorkspaceDMSend(workspaceId);
}
