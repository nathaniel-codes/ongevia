import { NextResponse } from "next/server";
import {
  normalizePhone,
  createPhoneOtp,
  getPhoneOtpSendGate,
} from "@/lib/phone";
import { sendBeemSms } from "@/lib/services/beem-sms";
import { prisma } from "@/lib/db/client";
import { logAction } from "@/lib/action-log";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalizePhone(String(body?.phone ?? ""));

  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid Tanzania phone number (e.g. 07XXXXXXXX)." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { isSuspended: true },
  });
  if (existing?.isSuspended) {
    return NextResponse.json(
      { error: "This account is suspended." },
      { status: 403 }
    );
  }

  const gate = await getPhoneOtpSendGate(phone);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error, retryAfterSec: gate.retryAfterSec },
      { status: 429 }
    );
  }

  const code = await createPhoneOtp(phone);
  const sms = await sendBeemSms({
    destAddr: phone,
    message: `Your Ongevia login code is ${code}. Valid for 10 minutes.`,
  });

  if (!sms.ok) {
    await logAction({
      actorType: "SYSTEM",
      action: "auth.otp_sms_failed",
      meta: { phone, error: sms.error, body: sms.body as object },
    });
    return NextResponse.json(
      { error: "Could not send SMS. Try again shortly." },
      { status: 502 }
    );
  }

  await logAction({
    actorType: "SYSTEM",
    action: "auth.otp_sent",
    meta: { phone },
  });

  return NextResponse.json({ ok: true, phone });
}
