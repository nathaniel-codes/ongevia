"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

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
  verifyAction: (formData: FormData) => void | Promise<void>;
  resendAction: (formData: FormData) => void | Promise<void>;
}) {
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
      {error ? (
        <p className="text-sm text-error" role="alert">
          {error === "session"
            ? "Your session expired after a system reset. Sign in again."
            : error}
        </p>
      ) : null}

      <form action={verifyAction} className="space-y-5">
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
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm tracking-widest"
          />
        </div>
        <SubmitButton
          label="Verify & sign in"
          pendingLabel="Verifying…"
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        />
      </form>

      <div className="space-y-3 border-t border-border pt-4">
        <form action={resendAction}>
          <input type="hidden" name="phone" value={phone} />
          <SubmitButton
            label="Resend code"
            pendingLabel="Sending…"
            className="block w-full text-center text-sm font-medium text-accent hover:underline disabled:opacity-60"
          />
        </form>
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
