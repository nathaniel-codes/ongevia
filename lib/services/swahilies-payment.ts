/**
 * Swahilies payment client — code 104 (money push) and code 103 (status poll).
 */

export interface SwahiliesPushParams {
  orderId: string;
  amountTzs: number;
  phoneLocal: string;
  metadata?: Record<string, string>;
}

export interface SwahiliesResult {
  ok: boolean;
  status: number;
  body: unknown;
  error?: string;
}

function credentials() {
  return {
    apiKey: process.env.SWAHILIES_API_KEY ?? "",
    secret: process.env.SWAHILIES_SECRET ?? "",
    username: process.env.SWAHILIES_USERNAME ?? "niatech",
    endpoint:
      process.env.SWAHILIES_ENDPOINT ??
      "https://swahiliesapi.invict.site/Api",
    isLive: process.env.SWAHILIES_IS_LIVE !== "false",
  };
}

async function postSwahilies(payload: unknown): Promise<SwahiliesResult> {
  const { endpoint, apiKey, secret } = credentials();
  if (!apiKey || !secret) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: "SWAHILIES credentials not configured",
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(async () => res.text());
    return {
      ok: res.ok,
      status: res.status,
      body,
      error: res.ok ? undefined : `Swahilies HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: err instanceof Error ? err.message : "Swahilies request failed",
    };
  }
}

/** Money push — code 104 */
export async function swahiliesMoneyPush(
  params: SwahiliesPushParams
): Promise<SwahiliesResult> {
  const { apiKey, secret, username, isLive } = credentials();
  return postSwahilies({
    api: 170,
    code: 104,
    data: {
      api_key: apiKey,
      secret,
      order_id: params.orderId,
      amount: params.amountTzs,
      username,
      is_live: isLive,
      phone_number: params.phoneLocal,
      metadata: {
        id: params.orderId,
        phone: params.phoneLocal,
        channel: "nia_studio",
        ...params.metadata,
      },
    },
  });
}

/** Status poll — code 103 */
export async function swahiliesPollStatus(
  orderId: string
): Promise<SwahiliesResult> {
  const { apiKey, secret } = credentials();
  return postSwahilies({
    api: 170,
    code: 103,
    data: {
      api_key: apiKey,
      secret,
      order_id: orderId,
    },
  });
}

/**
 * Parse poll response. Swahilies may return an array string or nested object.
 * Require status === "paid" and matching order id in metadata.
 */
export function isSwahiliesPaid(
  body: unknown,
  orderId: string
): { paid: boolean; record?: Record<string, unknown> } {
  let parsed: unknown = body;

  if (typeof body === "string") {
    try {
      parsed = JSON.parse(body);
    } catch {
      return { paid: false };
    }
  }

  const records: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { data?: unknown }).data)
      ? ((parsed as { data: unknown[] }).data)
      : parsed
        ? [parsed]
        : [];

  for (const item of records) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const status = String(rec.status ?? rec.Status ?? "").toLowerCase();
    if (status !== "paid") continue;

    let meta = rec.metadata ?? rec.meta;
    if (typeof meta === "string") {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = {};
      }
    }
    const metaObj = (meta && typeof meta === "object" ? meta : {}) as Record<
      string,
      unknown
    >;
    const metaOrder =
      String(metaObj.id ?? metaObj.order_id ?? rec.order_id ?? rec.orderId ?? "");
    if (metaOrder && metaOrder !== orderId) continue;

    const directOrder = String(rec.order_id ?? rec.orderId ?? "");
    if (directOrder && directOrder !== orderId) continue;

    return { paid: true, record: rec };
  }

  return { paid: false };
}
