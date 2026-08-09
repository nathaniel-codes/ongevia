"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-2xl font-semibold text-foreground">
        Ongevia
      </p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted">
        This page hit a server error. Try again, or sign in fresh if your
        session is stale.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link
          href="/api/auth/invalidate"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-hover"
        >
          Sign in again
        </Link>
      </div>
    </div>
  );
}
