import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import {
  normalizePhone,
  createPhoneOtp,
  getPhoneOtpSendGate,
} from "@/lib/phone";
import { sendBeemSms } from "@/lib/services/beem-sms";
import { prisma } from "@/lib/db/client";
import { logAction } from "@/lib/action-log";

export const metadata = {
  title: "Login - Ongevia",
  description:
    "Sign in with your phone to manage Instagram comment-to-DM campaigns.",
};

function loginRedirect(params: {
  error?: string;
  phone?: string;
  step?: string;
  callbackUrl?: string;
}) {
  const q = new URLSearchParams();
  if (params.error) q.set("error", params.error);
  if (params.phone) q.set("phone", params.phone);
  if (params.step) q.set("step", params.step);
  if (params.callbackUrl) q.set("callbackUrl", params.callbackUrl);
  redirect(`/login?${q.toString()}`);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    template?: string;
    error?: string;
    phone?: string;
    step?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const selectedTemplate = getCampaignTemplate(params.template);
  const templateCallbackUrl = selectedTemplate
    ? `/campaigns/new?template=${selectedTemplate.slug}`
    : null;
  const callbackUrl = params.callbackUrl ?? templateCallbackUrl ?? "/dashboard";

  if (session?.user) {
    redirect(callbackUrl);
  }

  const step = params.step === "otp" ? "otp" : "phone";
  const phone = params.phone ?? "";

  async function requestOtp(formData: FormData) {
    "use server";
    const phoneValue = String(formData.get("phone") ?? "");
    const normalized = normalizePhone(phoneValue);
    if (!normalized) {
      loginRedirect({
        error: "Enter a valid Tanzania phone number (e.g. 07XXXXXXXX).",
        phone: phoneValue,
      });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { phone: normalized },
      select: { isSuspended: true },
    });
    if (existing?.isSuspended) {
      loginRedirect({
        error: "This account is suspended.",
        phone: phoneValue,
      });
      return;
    }

    const gate = await getPhoneOtpSendGate(normalized);
    if (!gate.ok) {
      loginRedirect({
        error: gate.error,
        phone: phoneValue,
      });
      return;
    }

    const code = await createPhoneOtp(normalized);
    const sms = await sendBeemSms({
      destAddr: normalized,
      message: `Your Ongevia login code is ${code}. Valid for 10 minutes.`,
    });
    if (!sms.ok) {
      await logAction({
        actorType: "SYSTEM",
        action: "auth.otp_sms_failed",
        meta: { phone: normalized, error: sms.error },
      });
      loginRedirect({
        error: "Could not send SMS. Try again shortly.",
        phone: phoneValue,
      });
      return;
    }

    await logAction({
      actorType: "SYSTEM",
      action: "auth.otp_sent",
      meta: { phone: normalized },
    });

    loginRedirect({
      step: "otp",
      phone: phoneValue,
      callbackUrl,
    });
  }

  async function verifyOtp(formData: FormData) {
    "use server";
    const phoneValue = String(formData.get("phone") ?? "");
    const code = String(formData.get("code") ?? "");

    try {
      await signIn("phone-otp", {
        phone: phoneValue,
        code,
        name: "",
        redirectTo: callbackUrl,
      });
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      loginRedirect({
        step: "otp",
        phone: phoneValue,
        error:
          "Could not sign in. Check the code, or request a new one and try again.",
        callbackUrl,
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-display text-4xl font-semibold tracking-tight text-foreground"
          >
            Ongevia
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {selectedTemplate
              ? `Sign in to use the ${selectedTemplate.title} template.`
              : "Sign in with your phone number. We’ll text you a one-time code."}
          </p>
        </div>

        <div className="panel rounded-xl p-8 shadow-sm">
          {params.error && (
            <p className="mb-4 text-sm text-error">
              {params.error === "session"
                ? "Your session expired after a system reset. Sign in again."
                : params.error}
            </p>
          )}

          {step === "otp" ? (
            <form action={verifyOtp} className="space-y-5">
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
              <button
                type="submit"
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Verify & sign in
              </button>
              <Link
                href={`/login?phone=${encodeURIComponent(phone)}`}
                className="block text-center text-sm text-muted hover:text-foreground"
              >
                Resend or use a different number
              </Link>
            </form>
          ) : (
            <form action={requestOtp} className="space-y-5">
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
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Send login code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
