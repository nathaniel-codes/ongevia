"use client";

/**
 * Dashboard Home Page
 *
 * Wallet banner, default account, overview cards, and recent activity.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import StatCard from "@/components/stat-card";
import StatusBadge from "@/components/status-badge";

interface DashboardStats {
  userName: string | null;
  instagramUsername: string | null;
  contactsCount: number;
  totalAutomations: number;
  activeAutomations: number;
  dmsSentToday: number;
  dmsSentWeek: number;
  dmsSentMonth: number;
  dmsSkippedMonth: number;
  dmsFailedMonth: number;
  totalDMs: number;
  clicksThisMonth: number;
  totalClicks: number;
  ctrThisMonth: number;
  wallet: {
    balance: number;
    creditsGained: number;
    creditsSpent: number;
    dmCreditCost: number;
  };
  instagramAccounts: AccountOption[];
  selectedInstagramAccountId: string | null;
  topKeywords: { keyword: string; count: number }[];
  dailyDMs: { date: string; count: number }[];
  recentLogs: Array<{
    id: string;
    commenterName: string | null;
    commentText: string;
    status: string;
    createdAt: string;
    automation: { name: string };
    instagramAccount?: { username: string };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAccountId !== "all") {
      params.set("instagramAccountId", selectedAccountId);
    }

    fetch(`/api/dashboard/stats${params.size ? `?${params}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccountId]);

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="panel h-28 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="panel h-32 rounded p-5">
              <div className="h-10 w-10 rounded bg-surface-hover" />
              <div className="mt-4 h-6 w-16 rounded bg-surface-hover" />
              <div className="mt-2 h-4 w-24 rounded bg-surface-hover/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxDM = Math.max(...(stats?.dailyDMs.map((d) => d.count) ?? [1]), 1);
  const connectedCount = stats?.instagramAccounts.length ?? 0;
  const wallet = stats?.wallet;
  const defaultHandle = stats?.instagramUsername
    ? `@${stats.instagramUsername}`
    : null;
  const repliesLeft =
    wallet && wallet.dmCreditCost > 0
      ? Math.floor(wallet.balance / wallet.dmCreditCost)
      : null;

  return (
    <div className="space-y-8">
      {/* Wallet + default account banner */}
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#0f766e] via-[#0d5f59] to-[#0a3d3a] p-5 text-white sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">Credit balance</p>
            <p className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {(wallet?.balance ?? 0).toLocaleString()}
              <span className="ml-2 text-base font-sans font-medium text-white/70">
                TZS
              </span>
            </p>
            <p className="mt-3 text-sm text-white/80">
              You’ve gained{" "}
              <span className="font-semibold text-white">
                {(wallet?.creditsGained ?? 0).toLocaleString()} TZS
              </span>{" "}
              in credits (bonuses + top-ups)
              {wallet && wallet.creditsSpent > 0 ? (
                <>
                  {" "}
                  · spent {(wallet.creditsSpent ?? 0).toLocaleString()} TZS
                </>
              ) : null}
              {repliesLeft != null ? (
                <>
                  {" "}
                  · about {repliesLeft.toLocaleString()} replies left
                </>
              ) : null}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/wallet"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0f766e] hover:bg-white/90"
              >
                Top up wallet
              </Link>
              <Link
                href="/wallet"
                className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                View transactions
              </Link>
            </div>
          </div>

          <div className="min-w-[240px] rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-white/60">
              Instagram account
            </p>
            {defaultHandle ? (
              <>
                <p className="mt-2 text-xl font-semibold">{defaultHandle}</p>
                <p className="mt-1 text-sm text-white/75">
                  Your Instagram — Overview shows this page’s analytics.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/overview"
                    className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                  >
                    Open Overview
                  </Link>
                  <a
                    href="/api/instagram/connect"
                    className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                  >
                    Connect another
                  </a>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-lg font-semibold">Connect Instagram</p>
                <p className="mt-1 text-sm text-white/75">
                  Connect a professional Instagram account to run comment-to-DM
                  campaigns.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="/api/instagram/connect"
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0f766e] hover:bg-white/90"
                  >
                    Connect Instagram
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Greeting header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Hello, {stats?.userName ?? "there"}!
          </h1>
          <p className="mt-1 text-sm text-muted">
            {connectedCount} connected{" "}
            {connectedCount === 1 ? "account" : "accounts"}
            {" · "}
            {stats?.contactsCount ?? 0}{" "}
            {stats?.contactsCount === 1 ? "contact" : "contacts"}
            {" · "}
            <a href="/logs" className="text-accent hover:underline">
              See DM logs
            </a>
          </p>
        </div>
        {stats && stats.instagramAccounts.length > 1 && (
          <AccountSelect
            accounts={stats.instagramAccounts}
            value={selectedAccountId}
            onChange={handleAccountChange}
          />
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Active Campaigns"
          value={stats?.activeAutomations ?? 0}
        />
        <StatCard label="DMs Sent" value={stats?.dmsSentMonth ?? 0} />
        <StatCard label="Skipped" value={stats?.dmsSkippedMonth ?? 0} />
        <StatCard label="Failed" value={stats?.dmsFailedMonth ?? 0} />
        <StatCard label="Clicks" value={stats?.clicksThisMonth ?? 0} />
        <StatCard label="CTR" value={`${stats?.ctrThisMonth ?? 0}%`} />
      </div>

      {/* Chart + Recent Activity */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-6">
        <div className="panel rounded p-4 sm:p-6 lg:col-span-3">
          <h2 className="mb-6 text-sm font-semibold text-foreground">
            DMs — Last 7 Days
          </h2>
          <div className="flex h-40 items-end gap-1.5 sm:gap-2">
            {stats?.dailyDMs.map((day) => (
              <div
                key={day.date}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="text-xs font-medium text-muted">
                  {day.count}
                </span>
                <div
                  className="min-h-[4px] w-full rounded-sm bg-accent"
                  style={{
                    height: `${Math.max((day.count / maxDM) * 100, 4)}%`,
                  }}
                />
                <span className="w-full truncate text-center text-[10px] text-zinc-500">
                  {day.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded p-4 sm:p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Top Keywords
          </h2>
          <div className="space-y-3">
            {stats?.topKeywords.length === 0 && (
              <p className="py-8 text-sm text-muted">No keyword matches yet</p>
            )}
            {stats?.topKeywords.map((keyword) => (
              <div
                key={keyword.keyword}
                className="flex items-center justify-between gap-3"
              >
                <span className="truncate text-sm font-medium text-foreground">
                  {keyword.keyword}
                </span>
                <span className="text-xs text-muted">{keyword.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded p-4 sm:p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Recent Activity
          </h2>
          <div className="max-h-60 space-y-3 overflow-y-auto">
            {stats?.recentLogs.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">No activity yet</p>
            )}
            {stats?.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    @{log.commenterName ?? "unknown"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {log.instagramAccount
                      ? `@${log.instagramAccount.username} · `
                      : ""}
                    {log.commentText}
                  </p>
                </div>
                <StatusBadge status={log.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
