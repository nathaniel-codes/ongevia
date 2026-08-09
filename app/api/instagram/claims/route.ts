import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth";
import {
  canManageWorkspace,
  getCurrentWorkspaceContext,
} from "@/lib/workspace-access";
import {
  createPostClaim,
  getPostClaimStatus,
  listClaimsForWorkspace,
  releasePostClaim,
} from "@/lib/post-claims";

const createSchema = z
  .object({
    mediaId: z.string().min(1).optional().nullable(),
    postUrl: z.string().url().optional().nullable(),
  })
  .refine((d) => Boolean(d.mediaId) || Boolean(d.postUrl), {
    message: "Provide a mediaId or postUrl",
    path: ["postUrl"],
  });

export async function GET(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claimId = request.nextUrl.searchParams.get("id");
  if (claimId) {
    const claim = await getPostClaimStatus({
      workspaceId: context.workspaceId,
      claimId,
    });
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: claim });
  }

  const claims = await listClaimsForWorkspace(context.workspaceId);
  return NextResponse.json({ success: true, data: claims });
}

export async function POST(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  const userId = await getCurrentUserId();
  if (!context || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageWorkspace(context.role)) {
    return NextResponse.json(
      { error: "Only owners and admins can claim posts" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createPostClaim({
    workspaceId: context.workspaceId,
    userId,
    mediaId: parsed.data.mediaId,
    postUrl: parsed.data.postUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  const userId = await getCurrentUserId();
  if (!context || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageWorkspace(context.role)) {
    return NextResponse.json(
      { error: "Only owners and admins can release claims" },
      { status: 403 }
    );
  }

  const claimId = request.nextUrl.searchParams.get("id");
  if (!claimId) {
    return NextResponse.json({ error: "Missing claim id" }, { status: 400 });
  }

  const result = await releasePostClaim({
    workspaceId: context.workspaceId,
    userId,
    claimId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
