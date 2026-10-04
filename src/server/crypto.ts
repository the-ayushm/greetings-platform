import "server-only";
import crypto from "node:crypto";
import { env } from "./env";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** 22 base62 characters from a CSPRNG (≈131 bits). Rejection sampling keeps it unbiased. */
export function newSlug(length = 22): string {
  let out = "";
  while (out.length < length) {
    for (const b of crypto.randomBytes(length * 2)) {
      if (b < 248) out += BASE62[b % 62];
      if (out.length === length) break;
    }
  }
  return out;
}

export function hmacHex(secret: string, data: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/** Constant-time comparison of two hex/ascii strings. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** One-way, keyed hash used wherever we must count or correlate without storing the raw value (IPs). */
export function keyedHash(value: string): string {
  return hmacHex(env().APP_SECRET, `h:${value}`).slice(0, 32);
}

// ───────── passcodes (scrypt) ─────────
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 } as const;

export function hashPasscode(code: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(code, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export function verifyPasscode(code: string, stored: string): boolean {
  const [alg, n, salt, key] = stored.split("$");
  if (alg !== "scrypt" || !n || !salt || !key) return false;
  const expected = Buffer.from(key, "base64url");
  const got = crypto.scryptSync(code, Buffer.from(salt, "base64url"), expected.length, { N: Number(n), r: SCRYPT.r, p: SCRYPT.p });
  return crypto.timingSafeEqual(got, expected);
}

// ───────── signed, expiring tokens (passcode unlock cookie) ─────────
export function signToken(payload: Record<string, string | number>, ttlSeconds: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString("base64url");
  return `${body}.${hmacHex(env().APP_SECRET, `t:${body}`)}`;
}

export function readToken<T extends Record<string, unknown>>(token: string | undefined): (T & { exp: number }) | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, hmacHex(env().APP_SECRET, `t:${body}`))) return null;
  try {
    const v = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
    return typeof v.exp === "number" && v.exp > Date.now() / 1000 ? v : null;
  } catch {
    return null;
  }
}
