import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import { normalizePhone, createPhoneOtp } from "@/lib/phone";
import { sendBeemSms } from "@/lib/services/beem-sms";
import { prisma } from "@/lib/db/client";
import { logAction } from "@/lib/action-log";

export const metadata = {
  title: "Login - Ongevia",
  description: "Sign in with your phone to manage Instagram comment-to-DM campaigns.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    template?: string;
    error?: string;
    phone?: string;
    name?: string;
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
  const name = params.name ?? "";

  async function requestOtp(formData: FormData) {
    "use server";
    const phoneValue = String(formData.get("phone") ?? "");
    const nameValue = String(formData.get("name") ?? "").trim();
    const normalized = normalizePhone(phoneValue);
    if (!normalized) {
      redirect(
        `/login?error=${encodeURIComponent("Enter a valid Tanzania phone number (e.g. 07XXXXXXXX).")}&phone=${encodeURIComponent(phoneValue)}&name=${encodeURIComponent(nameValue)}`
      );
    }
    if (!nameValue || nameValue.length < 2) {
      redirect(
        `/login?error=${encodeURIComponent("Enter your name (at least 2 characters).")}&phone=${encodeURIComponent(phoneValue)}&name=${encodeURIComponent(nameValue)}`
      );
    }

    const existing = await prisma.user.findUnique({
      where: { phone: normalized },
      select: { isSuspended: true },
    });
    if (existing?.isSuspended) {
      redirect(
        `/login?error=${encodeURIComponent("This account is suspended.")}&phone=${encodeURIComponent(phoneValue)}&name=${encodeURIComponent(nameValue)}`
      );
    }

    const recent = await prisma.phoneOtp.count({
      where: {
        phone: normalized,
        createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recent >= 3) {
      redirect(
        `/login?error=${encodeURIComponent("Too many codes requested. Wait a few minutes.")}&phone=${encodeURIComponent(phoneValue)}&name=${encodeURIComponent(nameValue)}`
      );
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
      redirect(
        `/login?error=${encodeURIComponent("Could not send SMS. Try again shortly.")}&phone=${encodeURIComponent(phoneValue)}&name=${encodeURIComponent(nameValue)}`
      );
    }

    await logAction({
      actorType: "SYSTEM",
      action: "auth.otp_sent",
      meta: { phone: normalized },
    });

    redirect(
      `/login?step=otp&phone=${encodeURIComponent(phoneValue)}&name=${encodeURIComponent(nameValue)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  }

  async function verifyOtp(formData: FormData) {
    "use server";
    const phoneValue = String(formData.get("phone") ?? "");
    const nameValue = String(formData.get("name") ?? "").trim();
    const code = String(formData.get("code") ?? "");
    try {
      await signIn("phone-otp", {
        phone: phoneValue,
        code,
        name: nameValue,
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
      redirect(
        `/login?step=otp&phone=${encodeURIComponent(phoneValue)}&name=${encodeURIComponent(nameValue)}&error=${encodeURIComponent("Invalid or expired code")}&callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="font-display text-4xl font-semibold text-foreground tracking-tight"
          >
            Ongevia
          </Link>
          <p className="text-muted text-sm leading-relaxed mt-3">
            {selectedTemplate
              ? `Sign in to use the ${selectedTemplate.title} template.`
              : "Sign in with your phone, then connect your Instagram professional account."}
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
              <input type="hidden" name="name" value={name} />
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
                  maxLength={6}
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
                href="/login"
                className="block text-center text-sm text-muted hover:text-foreground"
              >
                Use a different number
              </Link>
            </form>
          ) : (
            <form action={requestOtp} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Your name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  defaultValue={name}
                  placeholder="e.g. Nathaniel"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
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
