/**
 * Shared Ongevia Instagram handle used for collaborate mode.
 * Prefer NEXT_PUBLIC_ so client + server stay in sync.
 */
export function platformIgUsername(): string {
  const raw =
    process.env.NEXT_PUBLIC_PLATFORM_IG_USERNAME ??
    process.env.PLATFORM_IG_USERNAME ??
    process.env.PLATFORM_INSTAGRAM_USERNAME ??
    "ongevia";
  return raw.trim().replace(/^@/, "").toLowerCase() || "ongevia";
}

export function platformIgHandle(): string {
  return `@${platformIgUsername()}`;
}
