/**
 * Shared Ongevia Instagram handle used for collaborate mode.
 * Prefer NEXT_PUBLIC_ so client + server stay in sync.
 */
export function platformIgUsername(): string {
  const raw =
    process.env.NEXT_PUBLIC_PLATFORM_IG_USERNAME ??
    process.env.PLATFORM_IG_USERNAME ??
    process.env.PLATFORM_INSTAGRAM_USERNAME ??
    "ongeviadotcom";
  return raw.trim().replace(/^@/, "").toLowerCase() || "ongeviadotcom";
}

export function platformIgHandle(): string {
  return `@${platformIgUsername()}`;
}
