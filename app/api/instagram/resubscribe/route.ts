import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { decryptToken } from "@/lib/meta/oauth";
import { subscribeInstagramAccountToWebhooks } from "@/lib/meta/client";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { logAction } from "@/lib/action-log";

/** Re-subscribe the workspace Instagram account to comments + messages webhooks. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const accounts = await prisma.instagramAccount.findMany({
    where: { workspaceId },
  });

  const results = [];
  for (const account of accounts) {
    try {
      const token = decryptToken(account.accessToken);
      const subscription = await subscribeInstagramAccountToWebhooks(
        account.instagramId,
        token
      );
      await prisma.instagramAccount.update({
        where: { id: account.id },
        data: { webhookSubscribed: Boolean(subscription.success) },
      });
      results.push({
        username: account.username,
        ok: Boolean(subscription.success),
      });
    } catch (err) {
      results.push({
        username: account.username,
        ok: false,
        error: err instanceof Error ? err.message : "failed",
      });
    }
  }

  await logAction({
    actorUserId: session.user.id,
    action: "instagram.resubscribe_webhooks",
    workspaceId,
    meta: { results },
  });

  return NextResponse.json({ success: true, results });
}
