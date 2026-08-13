import { NextResponse } from "next/server";

/** Clears Auth.js cookies after DB reset / deleted users so stale JWTs stop looping. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dest = new URL("/login", url.origin);
  dest.searchParams.set("error", "session");

  const response = NextResponse.redirect(dest);
  const cookieNames = [
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

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      secure: url.protocol === "https:",
      sameSite: "lax",
    });
    // Also clear without Secure for local/mismatched cookies.
    response.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
  }

  return response;
}
