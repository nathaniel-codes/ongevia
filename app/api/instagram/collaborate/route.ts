import { NextResponse } from "next/server";
import { getCurrentUserId, getCurrentWorkspaceId } from "@/lib/auth";
import { getPlatformSharedAccount } from "@/lib/instagram-accounts";
import { prisma } from "@/lib/db/client";
import { logAction } from "@/lib/action-log";

/**
 * Opt the current workspace into collaborating on the platform Ongevia IG page.
 * Does not require the user to OAuth their own Instagram.
 */
export async function POST() {
  const userId = await getCurrentUserId();
  const workspaceId = await getCurrentWorkspaceId();
  if (!userId || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let platform = await getPlatformSharedAccount();
  if (platform && !platform.isPlatformShared) {
    platform = await prisma.instagramAccount.update({
      where: { id: platform.id },
      data: { isPlatformShared: true },
    });
  }

  if (!platform) {
    return NextResponse.json(
      {
        error:
          "Ongevia shared page is not connected yet. Ask an admin to connect @ongeviadotcom and mark it shared.",
      },
      { status: 404 }
    );
  }

  await prisma.platformSetting.upsert({
    where: { key: `workspace:${workspaceId}:collaborate` },
    create: {
      key: `workspace:${workspaceId}:collaborate`,
      value: platform.id,
    },
    update: { value: platform.id },
  });

  await logAction({
    actorUserId: userId,
    action: "instagram.collaborate_enable",
    workspaceId,
    entityType: "InstagramAccount",
    entityId: platform.id,
    meta: { username: platform.username },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: platform.id,
      username: platform.username,
      isPlatformShared: true,
    },
  });
}

export async function DELETE() {
  const userId = await getCurrentUserId();
  const workspaceId = await getCurrentWorkspaceId();
  if (!userId || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.platformSetting.deleteMany({
    where: { key: `workspace:${workspaceId}:collaborate` },
  });

  await logAction({
    actorUserId: userId,
    action: "instagram.collaborate_disable",
    workspaceId,
  });

  return NextResponse.json({ success: true });
}
