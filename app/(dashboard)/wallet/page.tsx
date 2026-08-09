"use client";

import { useEffect, useState } from "react";

type TxType =
  | "TOP_UP"
  | "DM_SPEND"
  | "ADMIN_GRANT"
  | "ADMIN_DEBIT"
  | "REFUND";

interface WalletTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  type: TxType;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

function transactionLabel(tx: WalletTransaction): string {
  if (tx.note?.trim()) return tx.note.trim();
  switch (tx.type) {
    case "TOP_UP":
      return "Mobile money top-up";
    case "DM_SPEND":
      return "Comment / reply DM";
    case "ADMIN_GRANT":
      return tx.reference === "signup_bonus"
        ? "Welcome bonus"
        : "Credit grant";
    case "ADMIN_DEBIT":
      return "Admin adjustment";
    case "REFUND":
      return "Refund";
    default:
      return tx.type;
  }
}

function typeBadge(type: TxType): { label: string; className: string } {
  switch (type) {
    case "TOP_UP":
      return {
        label: "Top-up",
        className: "bg-success/10 text-success",
      };
    case "ADMIN_GRANT":
      return {
        label: "Bonus",
        className: "bg-accent/10 text-accent",
      };
    case "DM_SPEND":
      return {
        label: "Spend",
        className: "bg-warning/10 text-warning",
      };
    case "ADMIN_DEBIT":
      return {
        label: "Debit",
        className: "bg-error/10 text-error",
      };
    case "REFUND":
      return {
        label: "Refund",
        className: "bg-success/10 text-success",
      };
    default:
      return { label: type, className: "bg-muted/20 text-muted" };
  }
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("5000");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<
    Array<{
      id: string;
      orderId: string;
      amountTzs: number;
      credits: number;
      status: string;
      createdAt: string;
    }>
  >([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creditsPer1000, setCreditsPer1000] = useState(1000);
  const [dmCreditCost, setDmCreditCost] = useState(10);

  async function load() {
    const res = await fetch("/api/wallet");
    const payload = await res.json();
    if (payload.success) {
      setBalance(payload.data.balance);
      setOrders(payload.data.orders);
      setTransactions(payload.data.transactions ?? []);
      setCreditsPer1000(payload.data.creditsPer1000);
      if (typeof payload.data.dmCreditCost === "number") {
        setDmCreditCost(payload.data.dmCreditCost);
      }
    }
  }

  useEffect(() => {
    const immediate = setTimeout(() => void load(), 0);
    const t = setInterval(() => void load(), 5000);
    return () => {
      clearTimeout(immediate);
      clearInterval(t);
    };
  }, []);

  async function topUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountTzs: Number(amount),
        phone: phone || undefined,
      }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error ?? "Top-up failed");
    }
    await load();
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="panel rounded-xl p-6">
        <p className="text-sm text-muted">Credit balance</p>
        <p className="mt-2 font-display text-4xl font-semibold">
          {balance.toLocaleString()}
        </p>
        <p className="mt-2 text-xs text-muted">
          {creditsPer1000.toLocaleString()} credits per 1,000 TZS · each reply
          costs {dmCreditCost.toLocaleString()} credits
        </p>
      </section>

      <section className="panel rounded-xl p-6">
        <h2 className="text-base font-semibold">Top up with mobile money</h2>
        <form onSubmit={topUp} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Amount (TZS)</label>
            <input
              type="number"
              min={500}
              step={500}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Payment phone (optional, defaults to login phone)
            </label>
            <input
              type="tel"
              placeholder="07XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? "Sending prompt…" : "Pay with Swahilies"}
          </button>
        </form>
      </section>

      <section className="panel rounded-xl p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Transaction history</h2>
            <p className="mt-1 text-xs text-muted">
              Top-ups, bonuses, spends, and refunds
            </p>
          </div>
          <p className="text-xs text-muted">
            {transactions.length} recent
          </p>
        </div>
        <div className="space-y-0">
          {transactions.length === 0 && (
            <p className="text-sm text-muted">
              No transactions yet. Signup bonus and top-ups will show here.
            </p>
          )}
          {transactions.map((tx) => {
            const badge = typeBadge(tx.type);
            const credit = tx.amount >= 0;
            return (
              <div
                key={tx.id}
                className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <p className="truncate text-sm font-medium text-foreground">
                      {transactionLabel(tx)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatWhen(tx.createdAt)}
                    {" · "}
                    balance {tx.balanceAfter.toLocaleString()}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    credit ? "text-success" : "text-error"
                  }`}
                >
                  {credit ? "+" : ""}
                  {tx.amount.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel rounded-xl p-6">
        <h2 className="mb-4 text-base font-semibold">Payment orders</h2>
        <div className="space-y-3">
          {orders.length === 0 && (
            <p className="text-sm text-muted">No top-up requests yet.</p>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between border-b border-border py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {o.amountTzs.toLocaleString()} TZS → {o.credits.toLocaleString()}{" "}
                  credits
                </p>
                <p className="text-xs text-muted">
                  {formatWhen(o.createdAt)} · {o.orderId}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase text-muted">
                {o.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
