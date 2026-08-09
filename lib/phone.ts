import { timingSafeEqual } from "crypto";
import { createHash, randomInt, randomBytes } from "crypto";
import { prisma } from "@/lib/db/client";

/** Normalize Tanzania phone numbers to 255XXXXXXXXX */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("0") && normalized.length === 10) {
    normalized = `255${normalized.slice(1)}`;
  } else if (normalized.startsWith("255") && normalized.length === 12) {
    // already ok
  } else if (normalized.length === 9) {
    normalized = `255${normalized}`;
  } else {
    return null;
  }

  if (!/^255[67]\d{8}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

/** Display form for Swahilies: 07XXXXXXXX */
export function toLocalPhone(phone255: string): string {
  if (phone255.startsWith("255") && phone255.length === 12) {
    return `0${phone255.slice(3)}`;
  }
  return phone255;
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function generateOrderId(): string {
  return randomBytes(16).toString("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Digits-only OTP from user input (strips spaces). */
export function normalizeOtpCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, 6);
}

function hashesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

/** Cooldown between SMS sends to the same phone. */
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
/** Max OTP SMS per phone per rolling hour. */
export const OTP_MAX_PER_HOUR = 3;
/** Max OTP SMS per phone per rolling day. */
export const OTP_MAX_PER_DAY = 5;

export async function getPhoneOtpSendGate(phone: string): Promise<
  | { ok: true }
  | { ok: false; error: string; retryAfterSec?: number }
> {
  const latest = await prisma.phoneOtp.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (latest) {
    const elapsed = Date.now() - latest.createdAt.getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const retryAfterSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        ok: false,
        error: `Wait ${retryAfterSec}s before requesting another code.`,
        retryAfterSec,
      };
    }
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [perHour, perDay] = await Promise.all([
    prisma.phoneOtp.count({
      where: { phone, createdAt: { gt: hourAgo } },
    }),
    prisma.phoneOtp.count({
      where: { phone, createdAt: { gt: dayAgo } },
    }),
  ]);

  if (perHour >= OTP_MAX_PER_HOUR) {
    return {
      ok: false,
      error: "Too many codes this hour. Try again later.",
    };
  }
  if (perDay >= OTP_MAX_PER_DAY) {
    return {
      ok: false,
      error: "Daily SMS limit reached for this number. Try again tomorrow.",
    };
  }

  return { ok: true };
}

export async function createPhoneOtp(phone: string): Promise<string> {
  const code = generateOtpCode();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Invalidate older unused codes so only the latest SMS works.
  await prisma.phoneOtp.updateMany({
    where: { phone, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.phoneOtp.create({
    data: { phone, codeHash, expiresAt },
  });

  return code;
}

/**
 * Check OTP without consuming. Call consumePhoneOtp after signup/login succeeds
 * so a DB error after verify does not burn a paid SMS.
 */
export async function verifyPhoneOtp(
  phone: string,
  code: string
): Promise<
  | { ok: true; otpId: string }
  | { ok: false; error: string }
> {
  const normalizedCode = normalizeOtpCode(code);
  if (normalizedCode.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code." };
  }

  const latest = await prisma.phoneOtp.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return { ok: false, error: "No code found. Request a new one." };
  }

  if (latest.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Code expired. Request a new one." };
  }

  if (latest.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  const updated = await prisma.phoneOtp.update({
    where: { id: latest.id },
    data: { attempts: { increment: 1 } },
  });

  if (!hashesEqual(latest.codeHash, hashOtp(normalizedCode))) {
    const left = MAX_OTP_ATTEMPTS - updated.attempts;
    return {
      ok: false,
      error:
        left > 0
          ? `Invalid code. ${left} attempt${left === 1 ? "" : "s"} left.`
          : "Too many attempts. Request a new code.",
    };
  }

  return { ok: true, otpId: latest.id };
}

export async function consumePhoneOtp(otpId: string): Promise<void> {
  await prisma.phoneOtp.update({
    where: { id: otpId },
    data: { consumedAt: new Date() },
  });
}
