"use client";

import { useEffect, useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creditsPer1000, setCreditsPer1000] = useState(100);

  async function load() {
    const res = await fetch("/api/wallet");
    const payload = await res.json();
    if (payload.success) {
      setBalance(payload.data.balance);
      setOrders(payload.data.orders);
      setCreditsPer1000(payload.data.creditsPer1000);
    }
  }

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
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
        <p className="mt-2 font-display text-4xl font-semibold">{balance}</p>
        <p className="mt-2 text-xs text-muted">
          {creditsPer1000} credits per 1,000 TZS · used when DMs send
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
        <h2 className="mb-4 text-base font-semibold">Recent orders</h2>
        <div className="space-y-3">
          {orders.length === 0 && (
            <p className="text-sm text-muted">No top-ups yet.</p>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between border-b border-border py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {o.amountTzs.toLocaleString()} TZS → {o.credits} credits
                </p>
                <p className="text-xs text-muted">{o.orderId}</p>
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
