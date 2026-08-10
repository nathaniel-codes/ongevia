"use client";

import { useCallback, useEffect, useState } from "react";

export interface ClaimRow {
  id: string;
  mediaId: string;
  postUrl: string | null;
  claimantIgUsername: string;
  verifiedAt: string | null;
  expiresAt?: string | null;
  status: "PENDING" | "VERIFIED" | "EXPIRED" | "RELEASED";
  instagramAccountId: string;
  instagramAccount: { username: string; isPlatformShared: boolean };
}

interface PostClaimPanelProps {
  onClaimedPostSelect?: (mediaId: string, postUrl: string | null) => void;
  selectedMediaId?: string | null;
  compact?: boolean;
}

export default function PostClaimPanel({
  onClaimedPostSelect,
  selectedMediaId,
  compact = false,
}: PostClaimPanelProps) {
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [postUrl, setPostUrl] = useState("");
  const [pending, setPending] = useState<{
    id: string;
    dmText: string;
    platformUsername: string;
    expiresAt: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/instagram/claims");
    const payload = await res.json().catch(() => ({}));
    if (res.ok && payload.success) {
      setClaims(payload.data ?? []);
    }
  }, []);

  const markVerified = useCallback(
    async (mediaId?: string | null, verifiedPostUrl?: string | null) => {
      setPending(null);
      setWaiting(false);
      setPostUrl("");
      setStatusNote("Connected. Check Instagram for the confirmation DM.");
      await reload();
      if (onClaimedPostSelect && mediaId) {
        onClaimedPostSelect(mediaId, verifiedPostUrl ?? null);
      }
    },
    [onClaimedPostSelect, reload]
  );

  useEffect(() => {
    const t = setTimeout(() => void reload(), 0);
    return () => clearTimeout(t);
  }, [reload]);

  // Poll while waiting for the user to DM the connect code.
  useEffect(() => {
    if (!pending?.id) return;
    let cancelled = false;
    const tick = async () => {
      const res = await fetch(
        `/api/instagram/claims?id=${encodeURIComponent(pending.id)}`
      );
      const payload = await res.json().catch(() => ({}));
      if (cancelled || !res.ok) return;
      if (payload.data?.status === "VERIFIED") {
        await markVerified(payload.data.mediaId, payload.data.postUrl);
      }
    };
    const immediate = setTimeout(() => void tick(), 0);
    const interval = setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, [pending?.id, markVerified]);

  async function requestClaim() {
    setBusy("request");
    setError(null);
    setStatusNote(null);
    const res = await fetch("/api/instagram/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postUrl: postUrl.trim() || undefined }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(payload.error ?? "Could not start claim");
      setBusy(null);
      return;
    }
    if (payload.data?.alreadyVerified) {
      await markVerified(payload.data.mediaId, payload.data.postUrl);
    } else {
      setPending({
        id: payload.data.id,
        dmText: payload.data.dmText,
        platformUsername: payload.data.platformUsername,
        expiresAt: payload.data.expiresAt,
      });
      setWaiting(true);
    }
    setBusy(null);
  }

  async function checkClaim() {
    if (!pending?.id) return;
    setBusy("check");
    setError(null);
    setStatusNote(null);
    const res = await fetch("/api/instagram/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check", claimId: pending.id }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(payload.error ?? "Could not check DM");
      setBusy(null);
      return;
    }
    if (payload.data?.verified) {
      const statusRes = await fetch(
        `/api/instagram/claims?id=${encodeURIComponent(pending.id)}`
      );
      const statusPayload = await statusRes.json().catch(() => ({}));
      await markVerified(
        statusPayload.data?.mediaId,
        statusPayload.data?.postUrl
      );
    } else {
      setStatusNote(payload.data?.message ?? "Not verified yet.");
    }
    setBusy(null);
  }

  async function releaseClaim(id: string) {
    setBusy(`release:${id}`);
    setError(null);
    const res = await fetch(`/api/instagram/claims?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(payload.error ?? "Could not release claim");
    } else {
      if (pending?.id === id) {
        setPending(null);
        setWaiting(false);
      }
      await reload();
    }
    setBusy(null);
  }

  const verified = claims.filter((c) => c.status === "VERIFIED");
  const platformHandle =
    pending?.platformUsername ??
    claims[0]?.instagramAccount.username ??
    process.env.NEXT_PUBLIC_PLATFORM_IG_USERNAME ??
    "ongeviadotcom";

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Claim a post on @{platformHandle}
        </p>
        <p className="mt-1 text-xs text-muted">
          After @{platformHandle} is a collaborator on your Instagram post, paste
          the permalink, then DM @{platformHandle} the code below.
        </p>
      </div>

      {error ? (
        <p className="rounded border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
          {error}
        </p>
      ) : null}
      {statusNote ? (
        <p className="rounded border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-foreground">
          {statusNote}
        </p>
      ) : null}

      {!pending ? (
        <div className="space-y-2">
          <input
            type="url"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/…"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy === "request" || !postUrl.trim()}
            onClick={() => void requestClaim()}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {busy === "request" ? "Creating…" : "Get code"}
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded border border-border bg-surface/50 p-3">
          <p className="text-sm text-foreground">
            Open Instagram and DM{" "}
            <span className="font-semibold">@{pending.platformUsername}</span>{" "}
            this code:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded border border-border bg-background px-4 py-2.5 text-lg font-semibold tracking-[0.2em]">
              {pending.dmText}
            </code>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(pending.dmText)}
              className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-hover"
            >
              Copy
            </button>
            <button
              type="button"
              disabled={busy === "check"}
              onClick={() => void checkClaim()}
              className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {busy === "check" ? "Checking…" : "Check"}
            </button>
          </div>
          <p className="text-xs text-muted">
            {waiting
              ? "After you send the DM, tap Check — or wait, this page also updates automatically."
              : "Send the DM, then tap Check."}
            {pending.expiresAt
              ? ` Code expires ${new Date(pending.expiresAt).toLocaleTimeString()}.`
              : null}
          </p>
          <button
            type="button"
            onClick={() => {
              setPending(null);
              setWaiting(false);
              void releaseClaim(pending.id);
            }}
            className="rounded border border-border px-3 py-1.5 text-xs"
          >
            Cancel
          </button>
        </div>
      )}

      {verified.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Your verified posts
          </p>
          {verified.map((claim) => {
            const selected = selectedMediaId === claim.mediaId;
            return (
              <div
                key={claim.id}
                className={`flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-center sm:justify-between ${
                  selected ? "border-accent bg-accent/5" : "border-border"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {claim.postUrl ?? claim.mediaId}
                  </p>
                  <p className="text-xs text-muted">
                    Linked as @{claim.claimantIgUsername}
                  </p>
                </div>
                <div className="flex gap-2">
                  {onClaimedPostSelect ? (
                    <button
                      type="button"
                      onClick={() =>
                        onClaimedPostSelect(claim.mediaId, claim.postUrl)
                      }
                      className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-hover"
                    >
                      {selected ? "Selected" : "Use in campaign"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy === `release:${claim.id}`}
                    onClick={() => void releaseClaim(claim.id)}
                    className="rounded border border-error/30 px-3 py-1.5 text-xs font-medium text-error disabled:opacity-50"
                  >
                    Release
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
