import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { logAction } from "@/lib/action-log";

const bodySchema = z.object({
  instagramAccountId: z.string().min(1),
  isPlatformShared: z.boolean(),
});

/** Superadmin: mark an Instagram account as the shared Ongevia collaborate page. */
export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.isPlatformShared) {
    await prisma.instagramAccount.updateMany({
      data: { isPlatformShared: false },
    });
  }

  const account = await prisma.instagramAccount.update({
    where: { id: parsed.data.instagramAccountId },
    data: { isPlatformShared: parsed.data.isPlatformShared },
  });

  await logAction({
    actorUserId: admin.id,
    actorType: "ADMIN",
    action: "admin.platform_ig_flag",
    entityType: "InstagramAccount",
    entityId: account.id,
    meta: {
      username: account.username,
      isPlatformShared: account.isPlatformShared,
    },
  });

  return NextResponse.json({ success: true, data: account });
}
