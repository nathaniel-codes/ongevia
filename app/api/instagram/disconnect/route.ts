import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import {
  canManageWorkspace,
  getCurrentWorkspaceContext,
} from "@/lib/workspace-access";

export async function POST(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!canManageWorkspace(context.role)) {
    return NextResponse.json(
      { success: false, error: "Only owners and admins can disconnect accounts" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const instagramAccountId =
    typeof body.instagramAccountId === "string" ? body.instagramAccountId : null;

  if (instagramAccountId) {
    const account = await prisma.instagramAccount.findFirst({
      where: { id: instagramAccountId, workspaceId: context.workspaceId },
      select: { isPlatformShared: true },
    });
    if (account?.isPlatformShared) {
      return NextResponse.json(
        {
          success: false,
          error: "The Ongevia shared page cannot be disconnected from Settings",
        },
        { status: 400 }
      );
    }
  }

  await prisma.instagramAccount.deleteMany({
    where: {
      workspaceId: context.workspaceId,
      isPlatformShared: false,
      ...(instagramAccountId ? { id: instagramAccountId } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
