import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import PublicSiteHeader from "@/components/public-site-header";

export const metadata: Metadata = {
  title: "Ongevia — Instagram comment-to-DM automation",
  description:
    "Turn Instagram keyword comments into automatic private replies using the official Meta API. Phone login and wallet credits.",
};

const flowSteps = [
  {
    eyebrow: "Connect",
    title: "Link Instagram or collaborate",
    description:
      "Sign in with your phone. Connect your own Instagram, or collaborate with @ongeviadotcom without OAuth.",
  },
  {
    eyebrow: "Build",
    title: "Pick a post, keywords, and the DM",
    description:
      "Create a campaign for a reel or post: the keyword to watch, the public reply, and the DM to send.",
  },
  {
    eyebrow: "Deliver",
    title: "Replies go out through the official API",
    description:
      "Webhooks catch comments instantly and a polling sweep catches the ones Instagram never pushes. Every send is queued, rate-limited, and logged.",
  },
];

const features = [
  "Phone OTP sign-in",
  "Collaborate with @ongeviadotcom",
  "Connect your own Instagram",
  "Encrypted tokens at rest",
  "Webhook + polling reconciliation",
  "Queue-backed delivery worker",
  "Wallet credits via mobile money",
  "Tracked links with click stats",
  "DM logs with full status",
];

function AppWindow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-lg shadow-black/10">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-2 text-xs text-muted">{label}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

const overviewStats = [
  ["Views", "847.2K"],
  ["Reach", "612.4K"],
  ["Likes", "38.1K"],
  ["Comments", "4,204"],
  ["Saved", "9,712"],
  ["Shares", "2,340"],
];

const overviewPosts = [
  ["Spring drop reel", "214.8K", "9.1K", "Apr 3"],
  ["Restock haul", "88.4K", "5.2K", "Mar 28"],
  ["Behind the studio", "51.3K", "3.4K", "Mar 21"],
];

function OverviewPreview() {
  return (
    <AppWindow label="app / overview">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Overview</h3>
          <p className="mt-1 text-xs text-muted">
            Recent — 24 posts from @ongeviadotcom
          </p>
        </div>
        <span className="rounded border border-border px-2 py-1 text-xs text-muted">
          Last 50
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {overviewStats.map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-foreground">Top posts</p>
          <span className="text-xs text-muted">Views · Saves</span>
        </div>
        <div className="mt-3 space-y-2">
          {overviewPosts.map(([title, views, saves, date]) => (
            <div
              key={title}
              className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0"
            >
              <span className="truncate text-foreground">{title}</span>
              <span className="shrink-0 text-muted">
                {views} · {saves}
              </span>
              <span className="shrink-0 text-xs text-muted">{date}</span>
            </div>
          ))}
        </div>
      </div>
    </AppWindow>
  );
}

function MatchedCommentCard() {
  return (
    <div className="w-72 rounded-xl border border-border bg-surface p-4 shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        Keyword matched
      </p>
      <p className="mt-2 text-sm text-foreground">
        <span className="font-semibold">@shop.ava</span> commented{" "}
        <span className="font-medium text-accent">PRICE</span>
      </p>
      <p className="mt-2 text-xs text-muted">DM queued · public reply sent</p>
    </div>
  );
}

const dashboardStats = [
  ["Active", "12"],
  ["DMs Sent", "534"],
  ["CTR", "18%"],
];

const dashboardChart: [string, number][] = [
  ["Mon", 42],
  ["Tue", 68],
  ["Wed", 51],
  ["Thu", 94],
  ["Fri", 120],
  ["Sat", 86],
  ["Sun", 73],
];

function DashboardPreview() {
  const maxDM = Math.max(...dashboardChart.map(([, n]) => n));
  return (
    <AppWindow label="app / dashboard">
      <div className="rounded-xl bg-gradient-to-br from-[#0f766e] via-[#0d5f59] to-[#0a3d3a] p-4 text-white">
        <p className="text-xs text-white/70">Credit balance</p>
        <p className="mt-1 font-display text-3xl font-semibold">1,000 TZS</p>
        <p className="mt-2 text-xs text-white/80">
          Default account · @ongeviadotcom
        </p>
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground">
        Hello, there!
      </h3>
      <p className="mt-1 text-xs text-muted">
        1 connected account · collaborate ready
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {dashboardStats.map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">DMs — Last 7 Days</p>
        <div className="mt-4 flex h-28 items-end gap-2">
          {dashboardChart.map(([day, n]) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] text-muted">{n}</span>
              <div
                className="w-full rounded-sm bg-accent"
                style={{ height: `${Math.max((n / maxDM) * 100, 4)}%` }}
              />
              <span className="text-[10px] text-muted">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </AppWindow>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <PublicSiteHeader active="home" />

      <section className="relative mx-auto grid w-full max-w-6xl animate-fade-in items-center gap-10 px-5 pb-16 pt-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-24">
        <div className="max-w-3xl">
          <p className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Ongevia
          </p>

          <h1 className="mt-5 text-balance text-2xl font-medium leading-snug text-foreground sm:text-3xl">
            Comment keywords become Instagram DMs
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            Someone comments your keyword — they get your private reply through
            the official Meta API. Phone login, wallet credits, collaborate with
            @ongeviadotcom.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Get started
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-semibold text-muted transition hover:text-foreground"
            >
              See demo
            </Link>
          </div>
        </div>

        <div className="relative animate-slide-in">
          <OverviewPreview />
          <div className="absolute -bottom-8 -left-6 hidden lg:block">
            <MatchedCommentCard />
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              How it works
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              A comment in, a DM out
            </h2>
            <p className="mt-5 text-base leading-8 text-muted">
              Three steps. Connect or collaborate, build a campaign, and let it
              run. The webhook handles it live and the poll sweeps up whatever
              the webhook misses.
            </p>
          </div>

          <div className="grid gap-4">
            {flowSteps.map((step) => (
              <article
                key={step.title}
                className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-[120px_1fr]"
              >
                <p className="text-sm font-semibold text-accent">{step.eyebrow}</p>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/60 py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8">
          <DashboardPreview />

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              The dashboard
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Balance, account, and what happened
            </h2>
            <p className="mt-5 text-base leading-8 text-muted">
              See your wallet credits, default Instagram account, and every DM
              event: queued, matched, sent, skipped, or failed.
            </p>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            What&rsquo;s included
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Built for real campaigns
          </h2>
          <p className="mt-5 text-base leading-8 text-muted">
            Phone login, wallet top-ups, collaborate mode, and full delivery
            logs — without locking features behind tiers.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="rounded-xl border border-border bg-surface p-4 text-sm font-medium text-foreground"
            >
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-2xl border border-border bg-gradient-to-br from-[#0f766e] via-[#0d5f59] to-[#0a3d3a] p-6 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Turn your next reel&rsquo;s comments into DMs
            </h2>
            <p className="mt-4 text-base text-white/80">
              Sign in with your phone and start a campaign in minutes.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-accent transition hover:bg-white/90"
          >
            Get started
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 text-sm text-muted sm:px-6 lg:px-8">
          <span className="font-display text-base font-semibold text-foreground">
            Ongevia
          </span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
