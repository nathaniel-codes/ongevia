"use client";

import { useState, useTransition } from "react";

export default function LoginPhoneForm({
  phone,
  error,
  requestAction,
}: {
  phone: string;
  error?: string | null;
  requestAction: (formData: FormData) => Promise<{ url: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setLocalError(null);
        startTransition(async () => {
          try {
            const result = await requestAction(formData);
            window.location.assign(result.url);
          } catch {
            setLocalError("Could not send code. Try again.");
          }
        });
      }}
    >
      {(error || localError) && (
        <p className="text-sm text-error" role="alert">
          {error === "session"
            ? "Your session expired after a system reset. Sign in again."
            : (localError ?? error)}
        </p>
      )}
      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-medium">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          defaultValue={phone}
          placeholder="07XXXXXXXX"
          disabled={pending}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send login code"}
      </button>
    </form>
  );
}
