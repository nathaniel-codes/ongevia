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

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export async function createPhoneOtp(phone: string): Promise<string> {
  const code = generateOtpCode();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.phoneOtp.create({
    data: { phone, codeHash, expiresAt },
  });

  return code;
}

export async function verifyPhoneOtp(
  phone: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
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

  await prisma.phoneOtp.update({
    where: { id: latest.id },
    data: { attempts: { increment: 1 } },
  });

  if (latest.codeHash !== hashOtp(code.trim())) {
    return { ok: false, error: "Invalid code." };
  }

  await prisma.phoneOtp.update({
    where: { id: latest.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true };
}
