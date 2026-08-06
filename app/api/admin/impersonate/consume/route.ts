import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/admin/users", request.url));
  }

  try {
    await signIn("impersonate", { token, redirectTo: "/dashboard" });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
  }

  return NextResponse.redirect(
    new URL("/admin/users?error=Impersonation%20could%20not%20start", request.url)
  );
}
