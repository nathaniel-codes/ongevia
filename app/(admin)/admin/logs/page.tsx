import Link from "next/link";
import { prisma } from "@/lib/db/client";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;
  const logs = await prisma.actionLog.findMany({
    where: action ? { action } : undefined,
    include: {
      actor: { select: { email: true, phone: true } },
      impersonated: { select: { email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Action logs</h1>
        <p className="mt-2 text-sm text-muted">Latest 200 platform actions.</p>
      </div>
      <form className="flex max-w-md gap-2">
        <input name="action" defaultValue={action ?? ""} placeholder="Filter by action, e.g. admin.login"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">Filter</button>
        {action && <Link href="/admin/logs" className="rounded-lg border border-border px-3 py-2 text-sm">Clear</Link>}
      </form>
      <div className="panel overflow-x-auto rounded-xl">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="border-b border-border text-muted"><tr>
            <th className="px-4 py-3 font-medium">When</th><th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Actor</th><th className="px-4 py-3 font-medium">Impersonated user</th>
            <th className="px-4 py-3 font-medium">Entity</th><th className="px-4 py-3 font-medium">Metadata</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => <tr key={log.id}>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{log.createdAt.toLocaleString()}</td>
              <td className="px-4 py-3 font-medium">{log.action}</td>
              <td className="px-4 py-3">{log.actor?.email ?? log.actor?.phone ?? log.actorType}</td>
              <td className="px-4 py-3">{log.impersonated?.email ?? log.impersonated?.phone ?? "—"}</td>
              <td className="px-4 py-3">{log.entityType ? `${log.entityType}${log.entityId ? ` · ${log.entityId}` : ""}` : "—"}</td>
              <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted">{log.meta ? JSON.stringify(log.meta) : "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
