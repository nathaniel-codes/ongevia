"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

export default function LoginOtpForm({
  phone,
  notice,
  noticeKey,
  error,
  verifyAction,
  resendAction,
}: {
  phone: string;
  notice?: string | null;
  noticeKey?: string | null;
  error?: string | null;
  verifyAction: (formData: FormData) => Promise<void>;
  resendAction: (formData: FormData) => Promise<{ url: string }>;
}) {
  const [pendingVerify, startVerify] = useTransition();
  const [pendingResend, startResend] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {notice === "sent" ? (
        <p
          key={noticeKey ?? "sent"}
          className="animate-fade-in rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
          role="status"
        >
          New code sent to {phone}. Check your SMS.
        </p>
      ) : null}
      {(error || localError) && (
        <p className="text-sm text-error" role="alert">
          {error === "session"
            ? "Your session expired after a system reset. Sign in again."
            : (localError ?? error)}
        </p>
      )}

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setLocalError(null);
          startVerify(async () => {
            try {
              await verifyAction(formData);
            } catch (err) {
              // NextAuth signIn redirects by throwing NEXT_REDIRECT — ignore those.
              if (
                err &&
                typeof err === "object" &&
                "digest" in err &&
                String((err as { digest?: string }).digest).startsWith(
                  "NEXT_REDIRECT"
                )
              ) {
                return;
              }
              setLocalError(
                "Could not sign in. Check the code, or request a new one."
              );
            }
          });
        }}
      >
        <input type="hidden" name="phone" value={phone} />
        <p className="text-sm text-muted">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium text-foreground">{phone}</span>
        </p>
        <div className="space-y-2">
          <label htmlFor="code" className="block text-sm font-medium">
            Login code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            required
            maxLength={8}
            autoComplete="one-time-code"
            disabled={pendingVerify}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm tracking-widest disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={pendingVerify || pendingResend}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pendingVerify ? "Verifying…" : "Verify & sign in"}
        </button>
      </form>

      <div className="space-y-3 border-t border-border pt-4">
        <button
          type="button"
          disabled={pendingResend || pendingVerify}
          className="block w-full text-center text-sm font-medium text-accent hover:underline disabled:opacity-60"
          onClick={() => {
            const formData = new FormData();
            formData.set("phone", phone);
            setLocalError(null);
            startResend(async () => {
              try {
                const result = await resendAction(formData);
                window.location.assign(result.url);
              } catch {
                setLocalError("Could not resend code. Try again.");
              }
            });
          }}
        >
          {pendingResend ? "Sending…" : "Resend code"}
        </button>
        <Link
          href="/login"
          className="block text-center text-sm text-muted hover:text-foreground"
        >
          Use a different number
        </Link>
      </div>
    </div>
  );
}
