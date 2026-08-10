import { instagramShortcode } from "@/lib/utils/csv";

/**
 * Resolve an Instagram post/reel URL (or shortcode) to a numeric media id.
 * Uses the public post HTML `media_id` field, with shortcode base64 decode fallback.
 */
export async function resolveInstagramMediaIdFromUrl(
  postUrlOrShortcode: string
): Promise<string | null> {
  const shortcode =
    instagramShortcode(postUrlOrShortcode) ??
    (/^[A-Za-z0-9_-]{5,20}$/.test(postUrlOrShortcode.trim())
      ? postUrlOrShortcode.trim()
      : null);
  if (!shortcode) return null;

  const decoded = shortcodeToNumericId(shortcode);

  const urls = [
    `https://www.instagram.com/p/${shortcode}/`,
    `https://www.instagram.com/reel/${shortcode}/`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
          Accept: "text/html",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();
      const match = html.match(/"media_id":"(\d+)"/);
      if (match?.[1]) return match[1];
    } catch {
      // try next
    }
  }

  return decoded;
}

/** Instagram shortcode alphabet → numeric media id (legacy pk). */
export function shortcodeToNumericId(shortcode: string): string | null {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = BigInt(0);
  for (const ch of shortcode) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) return null;
    id = id * BigInt(64) + BigInt(idx);
  }
  return id > BigInt(0) ? id.toString() : null;
}
