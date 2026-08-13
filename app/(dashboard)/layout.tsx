import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser } from "@/lib/workspace";
import { listInstagramAccountsForWorkspace } from "@/lib/instagram-accounts";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      phone: true,
      email: true,
      isSuspended: true,
      isSuperAdmin: true,
    },
  });

  // Stale JWT after DB wipe / deleted account — clear cookies.
  if (!user || user.isSuspended) {
    redirect("/api/auth/invalidate");
  }

  const workspace = await ensureWorkspaceForUser(
    user.id,
    user.phone ?? user.email
  );
  const accounts = await listInstagramAccountsForWorkspace(workspace.id);
  const primary = accounts[0] ?? null;

  return (
    <DashboardShell
      workspaceName={workspace.name}
      instagramUsername={primary?.username ?? null}
      instagramAccountCount={accounts.length}
      isSuperAdmin={user.isSuperAdmin}
    >
      {children}
    </DashboardShell>
  );
}
