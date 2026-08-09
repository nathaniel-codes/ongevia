import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { assertDisplayNameAvailable } from "@/lib/username";
import { logAction } from "@/lib/action-log";

const bodySchema = z.object({
  name: z.string().min(2).max(80),
  payToShare: z.boolean().optional(),
});

/** Update display name. If taken, set payToShare=true to spend 5000 credits. */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const nameCheck = await assertDisplayNameAvailable({
    name: parsed.data.name,
    userId: session.user.id,
    payToShare: parsed.data.payToShare === true,
  });
  if (!nameCheck.ok) {
    return NextResponse.json(
      {
        error: nameCheck.error,
        code: nameCheck.code,
        payToShareAvailable: nameCheck.code === "taken",
      },
      { status: nameCheck.code === "insufficient" ? 402 : 409 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: nameCheck.name,
      nameKey: nameCheck.nameKey,
    },
    select: { id: true, name: true, nameKey: true },
  });

  await logAction({
    actorUserId: session.user.id,
    action: nameCheck.charged ? "user.name_share_paid" : "user.name_updated",
    entityType: "User",
    entityId: user.id,
    meta: {
      name: user.name,
      charged: nameCheck.charged,
    },
  });

  return NextResponse.json({ success: true, data: user });
}
