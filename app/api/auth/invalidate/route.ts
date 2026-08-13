import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/env";

const COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Secure-authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
];

function clearCookie(
  response: NextResponse,
  name: string,
  opts: { secure: boolean }
) {
  response.cookies.set(name, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax",
    secure: opts.secure,
  });
}

/** Clears Auth.js cookies after DB reset / deleted users so stale JWTs stop looping. */
export async function GET() {
  // Use public app URL — request.url is often http://localhost:3010 behind nginx.
  const dest = new URL("/login", getBaseUrl());
  dest.searchParams.set("error", "session");

  const response = NextResponse.redirect(dest);

  for (const name of COOKIE_NAMES) {
    const isSecureName =
      name.startsWith("__Secure-") || name.startsWith("__Host-");
    // Production session cookies are Secure; must clear with Secure or the
    // browser keeps them. Also clear a non-Secure copy for local/dev leftovers.
    clearCookie(response, name, { secure: true });
    if (!isSecureName) {
      clearCookie(response, name, { secure: false });
    }
    // Auth.js may chunk large JWTs as name.0, name.1, …
    for (let i = 0; i < 5; i++) {
      clearCookie(response, `${name}.${i}`, { secure: true });
      if (!isSecureName) {
        clearCookie(response, `${name}.${i}`, { secure: false });
      }
    }
  }

  return response;
}
