/**
 * Beem Africa SMS client — HTTP Basic Auth, exact payload layout.
 */

export interface BeemSendResult {
  ok: boolean;
  status: number;
  body: unknown;
  error?: string;
}

export async function sendBeemSms(params: {
  message: string;
  destAddr: string;
  recipientId?: number;
}): Promise<BeemSendResult> {
  const apiKey = process.env.BEEM_API_KEY;
  const secret = process.env.BEEM_SECRET_KEY;
  const sourceAddr = process.env.BEEM_SOURCE_ADDR ?? "NIATECH";
  const endpoint =
    process.env.BEEM_SMS_ENDPOINT ?? "https://apisms.beem.africa/v1/send";

  if (!apiKey || !secret) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: "BEEM_API_KEY / BEEM_SECRET_KEY not configured",
    };
  }

  const auth = Buffer.from(`${apiKey}:${secret}`).toString("base64");
  const payload = {
    source_addr: sourceAddr,
    schedule_time: "",
    encoding: 0,
    message: params.message,
    recipients: [
      {
        recipient_id: params.recipientId ?? 1,
        dest_addr: params.destAddr,
      },
    ],
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => null);
    return {
      ok: res.ok,
      status: res.status,
      body,
      error: res.ok ? undefined : `Beem HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: err instanceof Error ? err.message : "Beem request failed",
    };
  }
}
