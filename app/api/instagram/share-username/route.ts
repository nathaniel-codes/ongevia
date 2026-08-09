import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  canManageWorkspace,
  getCurrentWorkspaceContext,
} from "@/lib/workspace-access";
import {
  IG_USERNAME_SHARE_COST_TZS,
  purchaseIgUsernameShare,
} from "@/lib/instagram-username";
import { logAction } from "@/lib/action-log";

const bodySchema = z.object({
  username: z.string().min(1).max(64),
});

/** Pay 5,000 TZS so this workspace can connect an IG username already in use elsewhere. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageWorkspace(context.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const result = await purchaseIgUsernameShare({
    workspaceId: context.workspaceId,
    username: parsed.data.username,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    const status =
      result.code === "insufficient"
        ? 402
        : result.code === "not_needed"
          ? 409
          : 400;
    return NextResponse.json(
      {
        error: result.error,
        code: result.code,
        costTzs: IG_USERNAME_SHARE_COST_TZS,
      },
      { status }
    );
  }

  await logAction({
    actorUserId: session.user.id,
    action: "instagram.username_share_paid",
    entityType: "Workspace",
    entityId: context.workspaceId,
    workspaceId: context.workspaceId,
    meta: { username: parsed.data.username, charged: result.charged },
  });

  return NextResponse.json({
    success: true,
    data: {
      username: parsed.data.username,
      charged: result.charged,
      next: "Connect Instagram again to finish linking this account.",
    },
  });
}
