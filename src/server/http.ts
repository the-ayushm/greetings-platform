import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { adminDb } from "@/lib/supabase/admin";
import { keyedHash } from "./crypto";
import { log } from "./log";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const badRequest = (message = "Invalid request", extra?: Record<string, unknown>) => new ApiError(400, "bad_request", message, extra);
export const unauthorized = () => new ApiError(401, "unauthorized", "Please sign in.");
export const forbidden = () => new ApiError(403, "forbidden", "You don't have access to this.");
// Owned-or-missing resources answer 404 either way, so ids can't be probed.
export const notFound = () => new ApiError(404, "not_found", "Not found.");
export const conflict = (code: string, message: string, extra?: Record<string, unknown>) => new ApiError(409, code, message, extra);

const NO_STORE = { "cache-control": "no-store" };

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, { status, headers: { ...NO_STORE, ...headers } });
}

type Ctx<P> = { params: Promise<P> };

/** Wraps a route handler: typed errors become JSON, anything else becomes a logged 500. */
export function route<P = Record<string, string>>(fn: (req: Request, ctx: Ctx<P>) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return json({ error: { code: e.code, message: e.message, ...e.extra } }, e.status);
      }
      log.error("api.unhandled", e, { path: new URL(req.url).pathname, method: req.method });
      return json({ error: { code: "server_error", message: "Something went wrong. Please try again." } }, 500);
    }
  };
}

/**
 * CSRF defence for state-changing requests: the browser's Origin header must be one of ours.
 * (Session cookies are also SameSite=Lax, so cross-site POSTs don't carry them.)
 */
export function requireOrigin(req: Request, allowed: string[]) {
  const origin = req.headers.get("origin");
  if (!origin || !allowed.includes(origin)) throw new ApiError(403, "bad_origin", "Request origin not allowed.");
}

export async function readJson<S extends z.ZodType>(req: Request, schema: S, maxBytes = 64 * 1024): Promise<z.output<S>> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) throw new ApiError(415, "unsupported_media_type", "Expected JSON.");
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new ApiError(413, "too_large", "Request body too large.");
  const text = await req.text();
  if (Buffer.byteLength(text) > maxBytes) throw new ApiError(413, "too_large", "Request body too large.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw badRequest("Malformed JSON.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw badRequest("Some fields are invalid.", {
      issues: parsed.error.issues.slice(0, 20).map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  return parsed.data;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Fixed-window limit stored in Postgres (shared by all serverless instances). */
export async function rateLimit(bucket: string, subject: string, max: number, windowSeconds: number) {
  const { data, error } = await adminDb().rpc("rate_limit_hit", {
    p_key: `${bucket}:${keyedHash(subject)}`,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) {
    // Fail closed for abuse-sensitive buckets.
    log.error("ratelimit.error", error, { bucket });
    throw new ApiError(503, "unavailable", "Please try again in a moment.");
  }
  if (!data) throw new ApiError(429, "rate_limited", "Too many attempts. Please wait a little and try again.", { retryAfter: windowSeconds });
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
