import { randomBytes } from "node:crypto";
import { normalizePhone } from "@/lib/phone";

const INVITE_TTL_DAYS = 14;

export function normalizeInvitationPhone(phone: string) {
  return normalizePhone(phone);
}

/** @deprecated use normalizeInvitationPhone */
export function normalizeInvitationEmail(email: string) {
  return normalizePhone(email) ?? email.trim().toLowerCase();
}

export function generateInvitationToken() {
  return randomBytes(18).toString("base64url");
}

export function getInvitationExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);
  return expiresAt;
}

export function buildInvitationUrl(token: string, baseUrl?: string) {
  const resolvedBaseUrl =
    baseUrl ??
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXTAUTH_URL ?? "http://localhost:3010");

  return `${resolvedBaseUrl.replace(/\/$/, "")}/invite/${token}`;
}
