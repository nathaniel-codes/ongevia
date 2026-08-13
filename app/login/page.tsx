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
import LoginOtpForm from "@/components/login-otp-form";
import LoginPhoneForm from "@/components/login-phone-form";

export const metadata = {
  title: "Login - Ongevia",
  description:
    "Sign in with your phone to manage Instagram comment-to-DM campaigns.",
};

function buildLoginUrl(params: {
  error?: string;
  phone?: string;
  step?: string;
  notice?: string;
  callbackUrl?: string;
}) {
  const q = new URLSearchParams();
  if (params.error) q.set("error", params.error);
  if (params.phone) q.set("phone", params.phone);
  if (params.step) q.set("step", params.step);
  if (params.notice) {
    q.set("notice", params.notice);
    q.set("t", String(Date.now()));
  }
  if (params.callbackUrl) q.set("callbackUrl", params.callbackUrl);
  return `/login?${q.toString()}`;
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
    notice?: string;
    t?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const selectedTemplate = getCampaignTemplate(params.template);
  const templateCallbackUrl = selectedTemplate
    ? `/campaigns/new?template=${selectedTemplate.slug}`
    : null;
  const callbackUrl = params.callbackUrl ?? templateCallbackUrl ?? "/dashboard";

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  const step = params.step === "otp" ? "otp" : "phone";
  const phone = params.phone ?? "";

  async function requestOtp(formData: FormData): Promise<{ url: string }> {
    "use server";
    const phoneValue = String(formData.get("phone") ?? "");
    const normalized = normalizePhone(phoneValue);
    if (!normalized) {
      return {
        url: buildLoginUrl({
          error: "Enter a valid Tanzania phone number (e.g. 07XXXXXXXX).",
          phone: phoneValue,
        }),
      };
    }

    const existing = await prisma.user.findUnique({
      where: { phone: normalized },
      select: { isSuspended: true },
    });
    if (existing?.isSuspended) {
      return {
        url: buildLoginUrl({
          error: "This account is suspended.",
          phone: phoneValue,
        }),
      };
    }

    const gate = await getPhoneOtpSendGate(normalized);
    if (!gate.ok) {
      return {
        url: buildLoginUrl({
          step: "otp",
          phone: phoneValue,
          error: gate.error,
          callbackUrl,
        }),
      };
    }

    const code = await createPhoneOtp(normalized);
    const sms = await sendBeemSms({
      destAddr: normalized,
      message: `${code} is your Ongevia login code. Valid for 10 minutes.`,
    });
    if (!sms.ok) {
      await logAction({
        actorType: "SYSTEM",
        action: "auth.otp_sms_failed",
        meta: { phone: normalized, error: sms.error },
      });
      return {
        url: buildLoginUrl({
          step: "otp",
          phone: phoneValue,
          error: "Could not send SMS. Try again shortly.",
          callbackUrl,
        }),
      };
    }

    await logAction({
      actorType: "SYSTEM",
      action: "auth.otp_sent",
      meta: { phone: normalized },
    });

    return {
      url: buildLoginUrl({
        step: "otp",
        phone: phoneValue,
        notice: "sent",
        callbackUrl,
      }),
    };
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
      redirect(
        buildLoginUrl({
          step: "otp",
          phone: phoneValue,
          error:
            "Could not sign in. Check the code, or request a new one and try again.",
          callbackUrl,
        })
      );
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
          {step === "otp" ? (
            <LoginOtpForm
              phone={phone}
              notice={params.notice}
              noticeKey={params.t}
              error={params.error}
              verifyAction={verifyOtp}
              resendAction={requestOtp}
            />
          ) : (
            <LoginPhoneForm
              phone={phone}
              error={params.error}
              requestAction={requestOtp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
