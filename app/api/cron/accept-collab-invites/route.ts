import { NextRequest, NextResponse } from "next/server";
import {
  getCollaborationInvites,
  respondToCollaborationInvite,
} from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/oauth";
import { getPlatformSharedAccount } from "@/lib/instagram-accounts";
import { logAction } from "@/lib/action-log";

/**
 * Auto-accept Instagram collaboration invites for the shared @ongeviadotcom
 * account so users don't wait on a manual accept.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const platform = await getPlatformSharedAccount();
  if (!platform?.isPlatformShared) {
    return NextResponse.json({
      success: true,
      data: { accepted: 0, skipped: "no platform account" },
    });
  }

  const accessToken = decryptToken(platform.accessToken);
  let invites: Awaited<ReturnType<typeof getCollaborationInvites>> = [];
  try {
    invites = await getCollaborationInvites(
      accessToken,
      platform.instagramId
    );
  } catch (err) {
    return NextResponse.json({
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to list collaboration invites",
    });
  }

  const accepted: string[] = [];
  const errors: string[] = [];

  for (const invite of invites) {
    const mediaId = invite.media_id ?? invite.id;
    if (!mediaId) continue;
    try {
      await respondToCollaborationInvite(
        accessToken,
        platform.instagramId,
        mediaId,
        true
      );
      accepted.push(mediaId);
      await logAction({
        action: "instagram.collab_invite_accepted",
        workspaceId: platform.workspaceId,
        entityType: "InstagramAccount",
        entityId: platform.id,
        meta: {
          mediaId,
          owner: invite.media_owner_username ?? null,
        },
      });
    } catch (err) {
      errors.push(
        `${mediaId}: ${err instanceof Error ? err.message : "failed"}`
      );
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      pending: invites.length,
      accepted: accepted.length,
      mediaIds: accepted,
      errors,
    },
  });
}
