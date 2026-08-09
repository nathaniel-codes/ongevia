import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { normalizePhone, toLocalPhone, generateOrderId } from "@/lib/phone";
import {
  creditsForAmount,
  ensureWallet,
  getCreditsPer1000Tzs,
  getDmCreditCost,
} from "@/lib/wallet";
import { swahiliesMoneyPush } from "@/lib/services/swahilies-payment";
import { logAction } from "@/lib/action-log";
import type { Prisma } from "@/app/generated/prisma/client";

const topUpSchema = z.object({
  amountTzs: z.number().int().min(500).max(5_000_000),
  phone: z.string().min(9).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = await ensureWallet(session.user.id);
  const orders = await prisma.paymentOrder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      amount: true,
      balanceAfter: true,
      type: true,
      reference: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      balance: wallet.balance,
      orders,
      transactions,
      creditsPer1000: await getCreditsPer1000Tzs(),
      dmCreditCost: await getDmCreditCost(),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, isSuspended: true },
  });
  if (!user || user.isSuspended) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  const parsed = topUpSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid amount (min 500 TZS)" },
      { status: 400 }
    );
  }

  const phone255 =
    normalizePhone(parsed.data.phone ?? user.phone ?? "") ?? null;
  if (!phone255) {
    return NextResponse.json(
      { error: "A valid payment phone is required" },
      { status: 400 }
    );
  }

  const per1000 = await getCreditsPer1000Tzs();
  const credits = creditsForAmount(parsed.data.amountTzs, per1000);
  if (credits < 1) {
    return NextResponse.json(
      { error: "Amount too low for credits" },
      { status: 400 }
    );
  }

  const orderId = generateOrderId();
  const phoneLocal = toLocalPhone(phone255);
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

  await ensureWallet(session.user.id);

  const push = await swahiliesMoneyPush({
    orderId,
    amountTzs: parsed.data.amountTzs,
    phoneLocal,
  });

  const order = await prisma.paymentOrder.create({
    data: {
      userId: session.user.id,
      orderId,
      amountTzs: parsed.data.amountTzs,
      phone: phone255,
      credits,
      status: "PENDING",
      expiresAt,
      pushResponse: (push.body ?? { error: push.error }) as Prisma.InputJsonValue,
      metadata: {
        id: orderId,
        phone: phoneLocal,
        channel: "nia_studio",
      },
    },
  });

  await logAction({
    actorUserId: session.user.id,
    action: "payment.initiated",
    entityType: "PaymentOrder",
    entityId: order.id,
    meta: { orderId, amountTzs: parsed.data.amountTzs, credits },
    ip: request.headers.get("x-forwarded-for"),
  });

  if (!push.ok) {
    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: push.error ?? "Payment push failed", order },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { order },
  });
}
