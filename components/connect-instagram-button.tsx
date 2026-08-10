"use client";

import { useEffect, useId, useState } from "react";
import { platformIgHandle } from "@/lib/platform-ig";

interface ConnectInstagramButtonProps {
  label?: string;
  shortLabel?: string;
  className?: string;
  /** Show abbreviated "Connect" on small screens (top bar). */
  responsive?: boolean;
}

export default function ConnectInstagramButton({
  label = "Connect Instagram",
  shortLabel = "Connect",
  className = "shrink-0 whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded bg-accent text-white hover:bg-accent-hover",
  responsive = false,
}: ConnectInstagramButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const handle = platformIgHandle();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {responsive ? (
          <>
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </>
        ) : (
          label
        )}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Coming soon
            </p>
            <h2
              id={titleId}
              className="mt-2 text-xl font-semibold text-foreground"
            >
              Connect your own Instagram
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Linking your personal Instagram is not available yet. For now you
              can use {handle} — invite it on your Reel, claim the post in
              Settings, and run campaigns.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <a
                href="/settings"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover"
                onClick={() => setOpen(false)}
              >
                Claim a post
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
