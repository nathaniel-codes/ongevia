"use client";

import PostClaimPanel from "@/components/post-claim-panel";

const PLATFORM_HANDLE =
  process.env.NEXT_PUBLIC_PLATFORM_IG_USERNAME ?? "ongeviadotcom";

const steps = [
  {
    n: "01",
    title: "Turn on Collaborate",
    body:
      "One click below. Replies send from @" +
      PLATFORM_HANDLE +
      " — you never OAuth your Instagram with us.",
  },
  {
    n: "02",
    title: "Invite @" + PLATFORM_HANDLE + " on your Reel",
    body:
      "Instagram → your post → Collaborators → add @" +
      PLATFORM_HANDLE +
      ". Then open Instagram on the Ongevia phone and accept the invite (bell / notifications). After accept, comments are visible to Ongevia.",
  },
  {
    n: "03",
    title: "Prove it’s yours with a DM",
    body:
      "Paste the post link below, copy the connect code, and DM it to @" +
      PLATFORM_HANDLE +
      ". That locks the post to your workspace.",
  },
  {
    n: "04",
    title: "Build your campaign",
    body:
      "Create a campaign on the shared Ongevia account, pick your verified post, set keywords and the DM. @" +
      PLATFORM_HANDLE +
      " handles comments and private replies.",
  },
];

interface CollaborateGuideProps {
  collaborating: boolean;
  platformUsername?: string | null;
  busy: boolean;
  onEnable: () => void;
  onDisable?: () => void;
  error?: string | null;
}

export default function CollaborateGuide({
  collaborating,
  platformUsername,
  busy,
  onEnable,
  onDisable,
  error,
}: CollaborateGuideProps) {
  const handle = platformUsername ?? PLATFORM_HANDLE;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-[#0b1f1c] via-[#0f3d38] to-[#0f766e] text-white shadow-[0_20px_60px_-30px_rgba(15,118,110,0.55)]">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-300/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-emerald-200/10 blur-3xl"
        aria-hidden
      />

      <div className="relative p-5 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal-100/80">
          Shared page · @{handle}
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          Collaborate without
          <br />
          connecting Instagram
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-teal-50/85">
          Tag @{handle} as a collaborator on your Reel, accept on the Ongevia
          Instagram, then prove ownership with a DM. Or connect your own Instagram
          above if you want replies from your page.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className="ongevia-fade-up rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p className="font-mono text-[11px] text-teal-200/90">{step.n}</p>
              <p className="mt-2 text-sm font-semibold text-white">{step.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-teal-50/75">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {!collaborating ? (
            <button
              type="button"
              onClick={onEnable}
              disabled={busy}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#0b1f1c] transition hover:bg-teal-50 disabled:opacity-50"
            >
              {busy ? "Enabling…" : "Enable Collaborate"}
            </button>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Collaborate on
              </span>
              {onDisable ? (
                <button
                  type="button"
                  onClick={onDisable}
                  disabled={busy}
                  className="rounded-lg border border-white/25 px-4 py-2 text-xs font-medium text-white/90 hover:bg-white/10 disabled:opacity-50"
                >
                  Turn off
                </button>
              ) : null}
            </>
          )}
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-300/30 bg-red-500/15 px-3 py-2 text-xs text-red-100">
            {error}
          </p>
        ) : null}

        {collaborating ? (
          <div className="mt-8 rounded-xl border border-white/15 bg-[#f4f7f6] p-4 text-[#0b1f1c] sm:p-5">
            <p className="font-display text-xl text-[#0b1f1c]">Claim your post</p>
            <p className="mt-1 text-xs text-[#5a6f6a]">
              After @{handle} appears as collaborator on Instagram, claim the
              permalink here and DM the connect code.
            </p>
            <div className="mt-4">
              <PostClaimPanel />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
