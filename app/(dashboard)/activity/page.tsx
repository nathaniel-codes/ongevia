import { prisma } from "@/lib/db/client";
import { getCurrentWorkspaceId, requireSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Activity - Ongevia" };

export default async function ActivityPage() {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/dashboard");

  const workspaceId = await getCurrentWorkspaceId();

  const logs = await prisma.actionLog.findMany({
    where: {
      OR: [
        { actorUserId: admin.id },
        ...(workspaceId ? [{ workspaceId }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Activity</h1>
        <p className="mt-1 text-sm text-muted">
          Admin view — logins, payments, invites, and campaign actions.
        </p>
      </div>
      <div className="panel divide-y divide-border rounded-xl">
        {logs.length === 0 && (
          <p className="p-6 text-sm text-muted">No activity yet.</p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start justify-between gap-4 px-5 py-4"
          >
            <div>
              <p className="text-sm font-medium">{log.action}</p>
              <p className="mt-1 text-xs text-muted">
                {log.entityType}
                {log.entityId ? ` · ${log.entityId.slice(0, 10)}…` : ""}
              </p>
            </div>
            <time className="shrink-0 text-xs text-muted">
              {log.createdAt.toLocaleString()}
            </time>
          </div>
        ))}
      </div>
    </div>
  );
}
