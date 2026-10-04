/** Only same-site relative paths are allowed as post-login destinations (no open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || /[\r\n]/.test(next)) return fallback;
  try {
    const u = new URL(next, "http://x.invalid");
    return u.origin === "http://x.invalid" ? u.pathname + u.search : fallback;
  } catch {
    return fallback;
  }
}
