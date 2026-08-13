import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteHeader from "@/components/public-site-header";

export const metadata: Metadata = {
  title: "Demo Dashboard - Ongevia",
  description:
    "Preview the Ongevia dashboard with sample data. No login required.",
  robots: { index: true, follow: true },
};

const demoStats = [
  { label: "Active Campaigns", value: "3" },
  { label: "DMs Sent", value: "1,284" },
  { label: "Skipped", value: "42" },
  { label: "Failed", value: "3" },
  { label: "Clicks", value: "356" },
  { label: "CTR", value: "27.7%" },
];

const demoDays = [
  ["Sat", 42],
  ["Sun", 68],
  ["Mon", 51],
  ["Tue", 94],
  ["Wed", 120],
  ["Thu", 86],
  ["Fri", 73],
] as const;

const demoActivity = [
  ["@maya.co", "Product guide reply", "Sent"],
  ["@founder.ray", "Price request", "Sent"],
  ["@shop.ava", "Lead magnet", "Queued"],
];

export default function DemoDashboardPage() {
  const max = Math.max(...demoDays.map(([, n]) => n));

  return (
    <main className="min-h-screen">
      <PublicSiteHeader active="demo" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-sm">
          <p className="text-foreground">
            <span className="font-semibold">Demo preview</span>
            {" — "}sample dashboard preview. No login, no real Instagram
            connection.
          </p>
          <Link
            href="/login"
            className="rounded-lg bg-accent px-3 py-1.5 font-semibold text-white hover:bg-accent-hover"
          >
            Start free
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Hello, @yourbrand!
          </h1>
          <p className="mt-1 text-sm text-muted">
            1 connected account · 248 contacts · sample activity
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {demoStats.map((stat) => (
            <div key={stat.label} className="panel rounded-xl p-4">
              <p className="text-xs text-muted">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-6">
          <div className="panel rounded-xl p-5 lg:col-span-3">
            <h2 className="mb-6 text-sm font-semibold">DMs — Last 7 Days</h2>
            <div className="flex h-40 items-end gap-2">
              {demoDays.map(([day, count]) => (
                <div
                  key={day}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs text-muted">{count}</span>
                  <div
                    className="w-full min-h-[4px] rounded-sm bg-accent"
                    style={{ height: `${Math.max((count / max) * 100, 4)}%` }}
                  />
                  <span className="text-[10px] text-muted">{day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-xl p-5 lg:col-span-3">
            <h2 className="mb-4 text-sm font-semibold">Recent Activity</h2>
            <div className="divide-y divide-border">
              {demoActivity.map(([who, campaign, status]) => (
                <div
                  key={who}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{who}</p>
                    <p className="text-xs text-muted">{campaign}</p>
                  </div>
                  <span className="text-xs font-semibold text-success">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-sm text-muted">
          Connect your own Instagram after phone signup to run real campaigns.
          Meta requires each brand to authorize their own account.
        </p>
      </div>
    </main>
  );
}
