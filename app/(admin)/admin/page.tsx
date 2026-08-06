import { prisma } from "@/lib/db/client";

const number = new Intl.NumberFormat("en-TZ");
const currency = new Intl.NumberFormat("en-TZ", {
  style: "currency",
  currency: "TZS",
  maximumFractionDigits: 0,
});

export default async function AdminOverviewPage() {
  const [users, activeCampaigns, sentDms, paymentVolume, pendingPayments, errors] =
    await Promise.all([
      prisma.user.count(),
      prisma.automation.count({ where: { isActive: true } }),
      prisma.dmLog.count({ where: { status: "SENT" } }),
      prisma.paymentOrder.aggregate({
        where: { status: "PAID" },
        _sum: { amountTzs: true },
      }),
      prisma.paymentOrder.count({ where: { status: "PENDING" } }),
      prisma.operationalEvent.findMany({
        where: { level: "ERROR" },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, source: true, message: true, createdAt: true, workspace: { select: { name: true } } },
      }),
    ]);

  const stats = [
    { label: "Users", value: number.format(users) },
    { label: "Active campaigns", value: number.format(activeCampaigns) },
    { label: "DMs sent", value: number.format(sentDms) },
    { label: "Payment volume", value: currency.format(paymentVolume._sum.amountTzs ?? 0) },
    { label: "Pending payments", value: number.format(pendingPayments) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Overview</h1>
        <p className="mt-2 text-sm text-muted">Platform activity at a glance.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="panel rounded-xl p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </section>
      <section className="panel rounded-xl">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-xl font-semibold">Recent operational errors</h2>
        </div>
        {errors.length ? (
          <div className="divide-y divide-border">
            {errors.map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-4 px-5 py-4 text-sm">
                <div>
                  <p className="font-medium">{event.message}</p>
                  <p className="mt-1 text-muted">{event.source}{event.workspace ? ` · ${event.workspace.name}` : ""}</p>
                </div>
                <time className="shrink-0 text-muted">{event.createdAt.toLocaleString()}</time>
              </div>
            ))}
          </div>
        ) : <p className="px-5 py-8 text-sm text-muted">No operational errors recorded.</p>}
      </section>
    </div>
  );
}
