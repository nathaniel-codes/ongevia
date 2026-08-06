import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { adjustWallet } from "@/lib/wallet";
import { logAction } from "@/lib/action-log";

type UserUpdate = {
  userId?: string;
  isSuspended?: boolean;
  grantCredits?: number;
  note?: string;
};

async function updateUser(data: UserUpdate, adminId: string) {
  const { userId, isSuspended, grantCredits, note } = data;
  if (!userId || (isSuspended === undefined && grantCredits === undefined)) {
    return NextResponse.json({ error: "Provide a user and an update" }, { status: 400 });
  }
  if (typeof isSuspended !== "undefined" && typeof isSuspended !== "boolean") {
    return NextResponse.json({ error: "isSuspended must be a boolean" }, { status: 400 });
  }
  if (
    grantCredits !== undefined &&
    (!Number.isInteger(grantCredits) || grantCredits <= 0)
  ) {
    return NextResponse.json({ error: "grantCredits must be a positive integer" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (isSuspended !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { isSuspended } });
    await logAction({
      actorUserId: adminId,
      actorType: "ADMIN",
      action: isSuspended ? "admin.user_suspended" : "admin.user_unsuspended",
      entityType: "User",
      entityId: userId,
      meta: { note: note ?? null },
    });
  }

  let balance: number | undefined;
  if (grantCredits !== undefined) {
    ({ balance } = await adjustWallet({
      userId,
      amount: grantCredits,
      type: "ADMIN_GRANT",
      note,
      actorUserId: adminId,
    }));
  }

  return NextResponse.json({ success: true, data: { userId, balance } });
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    include: { wallet: { select: { balance: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ success: true, data: users });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as UserUpdate | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  return updateUser(body, admin.id);
}

export async function POST(request: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const grantValue = String(formData.get("grantCredits") ?? "").trim();
  const response = await updateUser(
    {
      userId: String(formData.get("userId") ?? ""),
      isSuspended: formData.has("isSuspended")
        ? String(formData.get("isSuspended")) === "true"
        : undefined,
      grantCredits: grantValue ? Number(grantValue) : undefined,
      note: String(formData.get("note") ?? "") || undefined,
    },
    admin.id
  );
  return response.ok
    ? NextResponse.redirect(new URL("/admin/users", request.url), { status: 303 })
    : response;
}
