import { prisma } from "@/lib/db/client";
import { getCurrentUserId, getCurrentWorkspaceId } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Activity - Ongevia" };

export default async function ActivityPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const workspaceId = await getCurrentWorkspaceId();

  const logs = await prisma.actionLog.findMany({
    where: {
      OR: [
        { actorUserId: userId },
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
          Every login, payment, invite, and campaign action for your account.
        </p>
      </div>
      <div className="panel rounded-xl divide-y divide-border">
        {logs.length === 0 && (
          <p className="p-6 text-sm text-muted">No activity yet.</p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-4 px-5 py-4">
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
