import { prisma } from "@/lib/db/client";
import { generateOtpCode, hashOtp } from "@/lib/phone";
import { getPlatformSharedAccount } from "@/lib/instagram-accounts";
import { decryptToken } from "@/lib/meta/oauth";
import {
  getAllUserMedia,
  getCollaborativeMedia,
  getConversations,
  getMediaById,
  sendDirectMessage,
} from "@/lib/meta/client";
import { instagramShortcode } from "@/lib/utils/csv";
import { logAction } from "@/lib/action-log";

/** User pastes this exact line into a DM to the shared Ongevia page. */
export function buildClaimDmText(code: string): string {
  return `connect ${code}`;
}

export function extractClaimCodeFromMessage(text: string): string | null {
  const match = text.trim().match(/\bconnect\s+(\d{6})\b/i);
  return match?.[1] ?? null;
}

const CLAIM_OTP_TTL_MS = 30 * 60 * 1000;

export async function isWorkspaceCollaborating(
  workspaceId: string
): Promise<boolean> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: `workspace:${workspaceId}:collaborate` },
  });
  return Boolean(setting?.value);
}

export async function getVerifiedClaim(
  workspaceId: string,
  instagramAccountId: string,
  mediaId: string
) {
  return prisma.postClaim.findFirst({
    where: {
      workspaceId,
      instagramAccountId,
      mediaId,
      status: "VERIFIED",
    },
  });
}

/**
 * Enforce post claim rules for collaborate campaigns on the shared IG page.
 * Own connected accounts and the platform account's home workspace skip claims.
 */
export async function assertCanAutomatePlatformPost(params: {
  workspaceId: string;
  account: {
    id: string;
    workspaceId: string;
    isPlatformShared: boolean;
  };
  postId: string | null | undefined;
  matchAnyPost?: boolean;
  pendingNextReel?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (!params.account.isPlatformShared) {
    return { ok: true };
  }

  // The workspace that OAuth'd the shared page owns it — no claim OTP needed.
  if (params.account.workspaceId === params.workspaceId) {
    return { ok: true };
  }

  if (params.matchAnyPost) {
    return {
      ok: false,
      error:
        "Match any post is not allowed on the shared Ongevia page. Claim a specific post instead.",
      status: 400,
    };
  }

  if (params.pendingNextReel) {
    return {
      ok: false,
      error:
        "Next reel targeting is not allowed on the shared Ongevia page. Claim a specific post instead.",
      status: 400,
    };
  }

  if (!params.postId) {
    return {
      ok: false,
      error: "Choose a claimed post on the Ongevia page",
      status: 400,
    };
  }

  if (!(await isWorkspaceCollaborating(params.workspaceId))) {
    return {
      ok: false,
      error: "Enable Collaborate via Ongevia page in Settings first",
      status: 403,
    };
  }

  const claim = await getVerifiedClaim(
    params.workspaceId,
    params.account.id,
    params.postId
  );
  if (!claim) {
    return {
      ok: false,
      error:
        "Verify ownership of this post first — claim it and DM the Ongevia page your connect code.",
      status: 403,
    };
  }

  return { ok: true };
}

async function resolveMediaOnPlatformAccount(params: {
  accessToken: string;
  platformInstagramId: string;
  mediaId?: string | null;
  postUrl?: string | null;
}): Promise<{ mediaId: string; postUrl: string | null } | null> {
  if (params.mediaId) {
    try {
      const media = await getMediaById(params.accessToken, params.mediaId);
      return { mediaId: media.id, postUrl: media.permalink ?? params.postUrl ?? null };
    } catch {
      // Fall through to library search
    }
  }

  if (!params.postUrl && !params.mediaId) return null;
  const shortcode = params.postUrl ? instagramShortcode(params.postUrl) : null;

  const [own, collab] = await Promise.all([
    getAllUserMedia(params.accessToken, 300).catch(() => []),
    getCollaborativeMedia(
      params.accessToken,
      params.platformInstagramId,
      200
    ).catch(() => []),
  ]);
  const library = [...own, ...collab];

  if (params.mediaId) {
    const byId = library.find((m) => m.id === params.mediaId);
    if (byId) {
      return { mediaId: byId.id, postUrl: byId.permalink ?? params.postUrl ?? null };
    }
  }

  if (shortcode) {
    const match = library.find((m) =>
      (m.permalink ?? "").includes(`/${shortcode}`)
    );
    if (match) {
      return {
        mediaId: match.id,
        postUrl: match.permalink ?? params.postUrl ?? null,
      };
    }
  }

  return null;
}

export async function createPostClaim(params: {
  workspaceId: string;
  userId: string;
  mediaId?: string | null;
  postUrl?: string | null;
}) {
  const collaborating = await isWorkspaceCollaborating(params.workspaceId);
  const platform = await getPlatformSharedAccount();
  if (!platform?.isPlatformShared) {
    return {
      ok: false as const,
      error: "Ongevia shared page is not available yet",
      status: 404,
    };
  }
  if (platform.workspaceId !== params.workspaceId && !collaborating) {
    return {
      ok: false as const,
      error: "Enable Collaborate via Ongevia page in Settings first",
      status: 403,
    };
  }

  const accessToken = decryptToken(platform.accessToken);
  const resolved = await resolveMediaOnPlatformAccount({
    accessToken,
    platformInstagramId: platform.instagramId,
    mediaId: params.mediaId,
    postUrl: params.postUrl,
  });
  if (!resolved) {
    return {
      ok: false as const,
      error:
        "Post not found yet. Invite @ongeviadotcom as a collaborator on the Instagram post, wait for auto-accept, then paste the permalink again.",
      status: 400,
    };
  }

  const existingVerified = await prisma.postClaim.findFirst({
    where: {
      instagramAccountId: platform.id,
      mediaId: resolved.mediaId,
      status: "VERIFIED",
    },
  });
  if (existingVerified && existingVerified.workspaceId !== params.workspaceId) {
    return {
      ok: false as const,
      error: "Another workspace already claimed this post",
      status: 409,
    };
  }
  if (existingVerified && existingVerified.workspaceId === params.workspaceId) {
    return {
      ok: true as const,
      data: {
        id: existingVerified.id,
        mediaId: existingVerified.mediaId,
        postUrl: existingVerified.postUrl,
        status: existingVerified.status,
        alreadyVerified: true,
        platformUsername: platform.username,
        dmText: null as string | null,
        expiresAt: null as string | null,
      },
    };
  }

  await prisma.postClaim.updateMany({
    where: {
      workspaceId: params.workspaceId,
      instagramAccountId: platform.id,
      mediaId: resolved.mediaId,
      status: "PENDING",
    },
    data: { status: "EXPIRED" },
  });

  const code = generateOtpCode();
  const dmText = buildClaimDmText(code);
  const claim = await prisma.postClaim.create({
    data: {
      workspaceId: params.workspaceId,
      instagramAccountId: platform.id,
      mediaId: resolved.mediaId,
      postUrl: resolved.postUrl,
      // Filled from the inbound DM sender once they paste the connect code.
      claimantIgUsername: "pending",
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + CLAIM_OTP_TTL_MS),
      status: "PENDING",
    },
  });

  await logAction({
    actorUserId: params.userId,
    action: "instagram.post_claim_requested",
    workspaceId: params.workspaceId,
    entityType: "PostClaim",
    entityId: claim.id,
    meta: { mediaId: resolved.mediaId },
  });

  return {
    ok: true as const,
    data: {
      id: claim.id,
      mediaId: claim.mediaId,
      postUrl: claim.postUrl,
      status: claim.status,
      alreadyVerified: false,
      platformUsername: platform.username,
      dmText,
      expiresAt: claim.expiresAt.toISOString(),
    },
  };
}

async function resolveSenderUsername(params: {
  accessToken: string;
  platformInstagramId: string;
  senderId: string;
}): Promise<string | null> {
  try {
    const conversations = await getConversations(
      params.accessToken,
      params.platformInstagramId
    );
    for (const convo of conversations) {
      for (const participant of convo.participants?.data ?? []) {
        if (participant.id === params.senderId && participant.username) {
          return participant.username.replace(/^@/, "").toLowerCase();
        }
      }
    }
  } catch {
    // Username is best-effort; IGSID association is enough to verify.
  }
  return null;
}

/**
 * When someone DMs the shared platform account with `connect ######`,
 * verify the matching pending PostClaim and associate their IG identity.
 */
export async function tryVerifyPostClaimFromInboundDm(params: {
  platformInstagramId: string;
  senderId: string;
  messageText: string;
}): Promise<{ verified: boolean; claimId?: string }> {
  const code = extractClaimCodeFromMessage(params.messageText);
  if (!code) return { verified: false };

  const platform = await prisma.instagramAccount.findFirst({
    where: {
      instagramId: params.platformInstagramId,
      isPlatformShared: true,
    },
  });
  if (!platform) return { verified: false };

  const codeHash = hashOtp(code);
  const pending = await prisma.postClaim.findMany({
    where: {
      instagramAccountId: platform.id,
      status: "PENDING",
      codeHash,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (pending.length === 0) return { verified: false };

  const claim = pending[0];

  const conflict = await prisma.postClaim.findFirst({
    where: {
      instagramAccountId: claim.instagramAccountId,
      mediaId: claim.mediaId,
      status: "VERIFIED",
      NOT: { id: claim.id },
    },
  });
  if (conflict) {
    await prisma.postClaim.update({
      where: { id: claim.id },
      data: { status: "EXPIRED" },
    });
    return { verified: false };
  }

  let username: string | null = null;
  try {
    const accessToken = decryptToken(platform.accessToken);
    username = await resolveSenderUsername({
      accessToken,
      platformInstagramId: platform.instagramId,
      senderId: params.senderId,
    });

    await sendDirectMessage(
      accessToken,
      platform.instagramId,
      params.senderId,
      username
        ? `Connected @${username}. This Ongevia post is now linked to your workspace.`
        : "Connected. This Ongevia post is now linked to your workspace."
    );
  } catch {
    // Verification still succeeds even if the confirmation DM fails.
  }

  await prisma.postClaim.update({
    where: { id: claim.id },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      claimantIgUserId: params.senderId,
      claimantIgUsername: username ?? `user_${params.senderId.slice(-6)}`,
      codeHash: hashOtp(`verified:${claim.id}`),
    },
  });

  await logAction({
    actorUserId: null,
    action: "instagram.post_claim_verified_dm",
    workspaceId: claim.workspaceId,
    entityType: "PostClaim",
    entityId: claim.id,
    meta: {
      mediaId: claim.mediaId,
      senderId: params.senderId,
      username,
    },
  });

  return { verified: true, claimId: claim.id };
}

/** @deprecated Prefer inbound DM verification; kept for status polling helpers. */
export async function getPostClaimStatus(params: {
  workspaceId: string;
  claimId: string;
}) {
  return prisma.postClaim.findFirst({
    where: { id: params.claimId, workspaceId: params.workspaceId },
    select: {
      id: true,
      mediaId: true,
      postUrl: true,
      status: true,
      claimantIgUsername: true,
      verifiedAt: true,
      expiresAt: true,
      instagramAccount: { select: { username: true } },
    },
  });
}

export async function releasePostClaim(params: {
  workspaceId: string;
  userId: string;
  claimId: string;
}) {
  const claim = await prisma.postClaim.findFirst({
    where: {
      id: params.claimId,
      workspaceId: params.workspaceId,
      status: { in: ["VERIFIED", "PENDING"] },
    },
  });
  if (!claim) {
    return { ok: false as const, error: "Claim not found", status: 404 };
  }

  if (claim.status === "VERIFIED") {
    const activeCampaign = await prisma.automation.findFirst({
      where: {
        workspaceId: params.workspaceId,
        instagramAccountId: claim.instagramAccountId,
        postId: claim.mediaId,
        isActive: true,
      },
    });
    if (activeCampaign) {
      return {
        ok: false as const,
        error:
          "Deactivate or delete campaigns on this post before releasing the claim",
        status: 400,
      };
    }
  }

  await prisma.postClaim.update({
    where: { id: claim.id },
    data: { status: "RELEASED" },
  });

  await logAction({
    actorUserId: params.userId,
    action: "instagram.post_claim_released",
    workspaceId: params.workspaceId,
    entityType: "PostClaim",
    entityId: claim.id,
    meta: { mediaId: claim.mediaId },
  });

  return { ok: true as const };
}

export async function listClaimsForWorkspace(workspaceId: string) {
  return prisma.postClaim.findMany({
    where: {
      workspaceId,
      status: { in: ["VERIFIED", "PENDING"] },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      mediaId: true,
      postUrl: true,
      claimantIgUsername: true,
      verifiedAt: true,
      expiresAt: true,
      status: true,
      instagramAccountId: true,
      instagramAccount: { select: { username: true, isPlatformShared: true } },
    },
  });
}

/** @deprecated use listClaimsForWorkspace */
export async function listVerifiedClaimsForWorkspace(workspaceId: string) {
  const all = await listClaimsForWorkspace(workspaceId);
  return all.filter((c) => c.status === "VERIFIED");
}

export async function filterAutomationsByPlatformClaims<
  T extends {
    workspaceId: string;
    postId: string | null;
    matchAnyPost: boolean;
    instagramAccount: {
      id: string;
      isPlatformShared: boolean;
      workspaceId: string;
    };
  },
>(automations: T[]): Promise<T[]> {
  if (automations.length === 0) return automations;

  const needsClaim = automations.filter(
    (a) =>
      a.instagramAccount.isPlatformShared &&
      a.instagramAccount.workspaceId !== a.workspaceId &&
      a.postId &&
      !a.matchAnyPost
  );

  const guestMatchAny = automations.filter(
    (a) =>
      a.instagramAccount.isPlatformShared &&
      a.instagramAccount.workspaceId !== a.workspaceId &&
      a.matchAnyPost
  );

  if (needsClaim.length === 0 && guestMatchAny.length === 0) {
    return automations;
  }

  const mediaIds = [
    ...new Set(needsClaim.map((a) => a.postId!).filter(Boolean)),
  ];
  const accountIds = [
    ...new Set(needsClaim.map((a) => a.instagramAccount.id)),
  ];

  const claims =
    mediaIds.length === 0
      ? []
      : await prisma.postClaim.findMany({
          where: {
            status: "VERIFIED",
            mediaId: { in: mediaIds },
            instagramAccountId: { in: accountIds },
          },
          select: {
            workspaceId: true,
            mediaId: true,
            instagramAccountId: true,
          },
        });

  const allowed = new Set(
    claims.map((c) => `${c.workspaceId}:${c.instagramAccountId}:${c.mediaId}`)
  );

  return automations.filter((a) => {
    if (!a.instagramAccount.isPlatformShared) return true;
    if (a.instagramAccount.workspaceId === a.workspaceId) return true;
    if (a.matchAnyPost) return false;
    if (!a.postId) return false;
    return allowed.has(
      `${a.workspaceId}:${a.instagramAccount.id}:${a.postId}`
    );
  });
}
