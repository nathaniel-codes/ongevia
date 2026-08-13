import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/env";

const SESSION_COOKIE_PREFIXES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "authjs.csrf-token",
  "__Secure-authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
];

function shouldClear(name: string): boolean {
  return SESSION_COOKIE_PREFIXES.some(
    (prefix) => name === prefix || name.startsWith(`${prefix}.`)
  );
}

/** Clears Auth.js cookies after DB reset / deleted users so stale JWTs stop looping. */
export async function GET(request: NextRequest) {
  // Use public app URL — request.url is often http://localhost:3010 behind nginx.
  const dest = new URL("/login", getBaseUrl());
  dest.searchParams.set("error", "session");

  const response = NextResponse.redirect(dest);

  const names = new Set<string>();
  for (const cookie of request.cookies.getAll()) {
    if (shouldClear(cookie.name)) names.add(cookie.name);
  }
  // Always try the common session cookie names even if absent from this request.
  for (const name of [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ]) {
    names.add(name);
  }

  for (const name of names) {
    const secure = name.startsWith("__Secure-") || name.startsWith("__Host-");
    response.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
      secure,
    });
  }

  return response;
}
