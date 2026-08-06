import Link from "next/link";
import { prisma } from "@/lib/db/client";
import type { PaymentOrderStatus } from "@/app/generated/prisma/client";

const statuses = ["ALL", "PENDING", "PAID", "FAILED", "EXPIRED"] as const;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status = statuses.includes(rawStatus as (typeof statuses)[number])
    ? rawStatus!
    : "ALL";
  const orders = await prisma.paymentOrder.findMany({
    where: status === "ALL" ? undefined : { status: status as PaymentOrderStatus },
    include: { user: { select: { email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Payments</h1>
        <p className="mt-2 text-sm text-muted">Most recent 200 payment orders.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Link key={item} href={item === "ALL" ? "/admin/payments" : `/admin/payments?status=${item}`}
            className={`rounded-full px-3 py-1.5 text-sm ${status === item ? "bg-accent text-white" : "panel text-muted hover:text-foreground"}`}>
            {item}
          </Link>
        ))}
      </div>
      <div className="panel overflow-x-auto rounded-xl">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-border text-muted"><tr>
            <th className="px-4 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Credits</th>
            <th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Created</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => <tr key={order.id}>
              <td className="px-4 py-3 font-mono text-xs">{order.orderId}</td>
              <td className="px-4 py-3">{order.user.email ?? order.user.phone ?? "—"}</td>
              <td className="px-4 py-3">{order.amountTzs.toLocaleString()} TZS</td>
              <td className="px-4 py-3">{order.credits.toLocaleString()}</td>
              <td className="px-4 py-3">{order.status}</td>
              <td className="px-4 py-3 text-muted">{order.createdAt.toLocaleString()}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
