import { NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { listInstagramAccountsForWorkspace } from "@/lib/instagram-accounts";

export const runtime = "nodejs";

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const accounts = await listInstagramAccountsForWorkspace(workspaceId);

  return NextResponse.json({
    success: true,
    data: {
      instagramAccounts: accounts.map((a) => ({
        id: a.id,
        username: a.username,
        instagramId: a.instagramId,
        name: a.name,
        isPlatformShared: false,
        ownedByWorkspace: true,
      })),
      selectedInstagramAccountId: accounts[0]?.id ?? null,
    },
  });
}
