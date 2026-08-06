import { prisma } from "@/lib/db/client";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { wallet: { select: { balance: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Users</h1>
        <p className="mt-2 text-sm text-muted">Most recently registered 200 users.</p>
      </div>
      <div className="panel overflow-x-auto rounded-xl">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.phone ?? "—"}</td>
                <td className="px-4 py-3">{user.email ?? "—"}</td>
                <td className="px-4 py-3">{user.wallet?.balance ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={user.isSuspended ? "text-error" : "text-success"}>
                    {user.isSuspended ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{user.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <form action="/api/admin/users" method="post">
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="isSuspended" value={String(!user.isSuspended)} />
                      <button className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-hover">
                        {user.isSuspended ? "Unsuspend" : "Suspend"}
                      </button>
                    </form>
                    <form action="/api/admin/users" method="post" className="flex items-center gap-1">
                      <input type="hidden" name="userId" value={user.id} />
                      <input name="grantCredits" type="number" min="1" placeholder="Credits" className="w-20 rounded border border-border bg-background px-2 py-1 text-xs" />
                      <button className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-hover">Grant</button>
                    </form>
                    <form action="/api/admin/impersonate" method="post">
                      <input type="hidden" name="userId" value={user.id} />
                      <button className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-hover">Impersonate</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
