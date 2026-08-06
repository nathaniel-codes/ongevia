import { prisma } from "@/lib/db/client";
import {
  isSwahiliesPaid,
  swahiliesPollStatus,
} from "@/lib/services/swahilies-payment";
import { adjustWallet } from "@/lib/wallet";
import { logAction } from "@/lib/action-log";
import type { Prisma } from "@/app/generated/prisma/client";

export async function pollPendingPayments(): Promise<number> {
  const now = new Date();
  const pending = await prisma.paymentOrder.findMany({
    where: { status: "PENDING" },
    take: 50,
    orderBy: { createdAt: "asc" },
  });

  let paidCount = 0;

  for (const order of pending) {
    if (order.expiresAt.getTime() < now.getTime()) {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: "EXPIRED" },
      });
      await logAction({
        actorUserId: order.userId,
        actorType: "SYSTEM",
        action: "payment.expired",
        entityType: "PaymentOrder",
        entityId: order.id,
        meta: { orderId: order.orderId },
      });
      continue;
    }

    const poll = await swahiliesPollStatus(order.orderId);
    const { paid, record } = isSwahiliesPaid(poll.body, order.orderId);

    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        pollResponse: (poll.body ?? null) as Prisma.InputJsonValue,
      },
    });

    if (!paid) continue;

    const updated = await prisma.paymentOrder.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        pollResponse: (record ?? poll.body ?? null) as Prisma.InputJsonValue,
      },
    });

    if (updated.count === 0) continue;

    await adjustWallet({
      userId: order.userId,
      amount: order.credits,
      type: "TOP_UP",
      reference: order.orderId,
      note: `Swahilies top-up ${order.amountTzs} TZS`,
    });

    await logAction({
      actorUserId: order.userId,
      action: "payment.paid",
      entityType: "PaymentOrder",
      entityId: order.id,
      meta: { orderId: order.orderId, credits: order.credits },
    });

    paidCount += 1;
  }

  return paidCount;
}
