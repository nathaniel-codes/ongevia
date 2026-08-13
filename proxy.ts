import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/automations",
  "/logs",
  "/settings",
  "/wallet",
  "/activity",
  "/campaigns",
  "/overview",
  "/inbox",
  "/diagnostics",
];

function hasSessionCookie(request: NextRequest): boolean {
  for (const cookie of request.cookies.getAll()) {
    const name = cookie.name;
    if (
      name === "authjs.session-token" ||
      name === "__Secure-authjs.session-token" ||
      name === "next-auth.session-token" ||
      name === "__Secure-next-auth.session-token" ||
      name.startsWith("authjs.session-token.") ||
      name.startsWith("__Secure-authjs.session-token.") ||
      name.startsWith("next-auth.session-token.") ||
      name.startsWith("__Secure-next-auth.session-token.")
    ) {
      return true;
    }
  }
  return false;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAdminLogin = pathname === "/admin/login";
  const isAuthenticated = hasSessionCookie(request);

  // Cookie present ≠ valid session (e.g. after DB wipe). Only the login page
  // should redirect based on auth(); bouncing here causes a blank-page loop.
  if (isProtected && !isAuthenticated && !isAdminLogin) {
    const loginUrl = new URL(
      pathname.startsWith("/admin") ? "/admin/login" : "/login",
      request.url
    );
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/automations/:path*",
    "/logs/:path*",
    "/settings/:path*",
    "/wallet/:path*",
    "/activity/:path*",
    "/campaigns/:path*",
    "/overview/:path*",
    "/inbox/:path*",
    "/diagnostics/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
  ],
};
