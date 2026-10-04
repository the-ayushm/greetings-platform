import "server-only";

/**
 * Structured, PII-safe logging (JSON lines → Vercel log drains). Keys that may carry personal
 * data or secrets are redacted wherever they appear; free-text customer content is never
 * logged — callers pass ids, counts and statuses only.
 */
const REDACT = /^(email|phone|contact|name|full_?name|recipient.*|sender.*|content|draft_?content|message|caption|title|passcode|password|token|secret|signature|authorization|cookie|card|vpa|address|ip)$/i;

type Fields = Record<string, unknown>;

function scrub(v: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth]";
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => scrub(x, depth + 1));
  if (v && typeof v === "object") {
    const out: Fields = {};
    for (const [k, val] of Object.entries(v as Fields)) out[k] = REDACT.test(k) ? "[redacted]" : scrub(val, depth + 1);
    return out;
  }
  if (typeof v === "string") return v.length > 300 ? v.slice(0, 300) + "…" : v;
  return v;
}

/** Error text can quote values (e.g. a unique-key violation): mask emails and long digit runs. */
const maskText = (t: string) =>
  t
    .replace(/[^\s@"'()]+@[^\s@"'()]+\.[a-z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s-]{8,}\d/g, "[number]")
    .slice(0, 300);

function describeError(err: unknown) {
  if (err instanceof Error) return { type: err.name, detail: maskText(err.message) };
  if (err && typeof err === "object") {
    const e = err as { code?: unknown; message?: unknown };
    return { type: String(e.code ?? "object"), detail: maskText(String(e.message ?? "")) };
  }
  return { type: typeof err, detail: maskText(String(err ?? "")) };
}

function emit(level: "info" | "warn" | "error", event: string, fields?: Fields, err?: unknown) {
  const line = JSON.stringify({ level, event, at: new Date().toISOString(), ...(scrub(fields ?? {}) as Fields), ...(err !== undefined ? { err: describeError(err) } : {}) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (process.env.LOG_LEVEL !== "silent") process.stdout.write(line + "\n");
}

export const log = {
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, err?: unknown, fields?: Fields) => emit("error", event, fields, err ?? null),
};

export const _scrubForTest = scrub;
export const _describeErrorForTest = describeError;
