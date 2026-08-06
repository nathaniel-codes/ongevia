import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { logAction } from "@/lib/action-log";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  const input = contentType.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries(await request.formData());
  const userId = typeof input.userId === "string" ? input.userId : "";
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isSuspended: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.isSuspended) return NextResponse.json({ error: "Cannot impersonate a suspended user" }, { status: 400 });

  const token = randomUUID();
  await prisma.platformSetting.create({
    data: {
      key: `impersonate:${token}`,
      value: JSON.stringify({
        adminId: admin.id,
        targetUserId: user.id,
        exp: Date.now() + 5 * 60 * 1000,
      }),
    },
  });
  await logAction({
    actorUserId: admin.id,
    actorType: "ADMIN",
    action: "admin.impersonate_start",
    entityType: "User",
    entityId: user.id,
  });

  const url = `/api/admin/impersonate/consume?token=${encodeURIComponent(token)}`;
  if (contentType.includes("application/json")) {
    return NextResponse.json({ url });
  }
  return NextResponse.redirect(new URL(url, request.url), { status: 303 });
}
