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
    "__Host-authjs.csrf-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      secure: url.protocol === "https:",
      sameSite: "lax",
    });
  }

  return response;
}
