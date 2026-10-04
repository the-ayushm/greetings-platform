import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-next";
import { hashPasscode, newSlug, readToken, safeEqual, signToken, verifyPasscode } from "@/server/crypto";
import { _scrubForTest } from "@/server/log";
import { verifyCheckoutSignature, verifyWebhookSignature } from "@/server/razorpay";
import { sanitizeFilename } from "@/server/media";

describe("slugs", () => {
  it("are 22 base62 chars and do not repeat", () => {
    const set = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      const s = newSlug();
      expect(s).toMatch(/^[A-Za-z0-9]{22}$/);
      set.add(s);
    }
    expect(set.size).toBe(5000);
  });

  it("use the whole alphabet roughly evenly (no modulo bias)", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 4000; i++) for (const ch of newSlug()) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    expect(counts.size).toBe(62);
    const vals = [...counts.values()];
    expect(Math.max(...vals) / Math.min(...vals)).toBeLessThan(1.35);
  });
});

describe("passcodes and signed tokens", () => {
  it("hashes with a salt and verifies", () => {
    const h1 = hashPasscode("1402");
    const h2 = hashPasscode("1402");
    expect(h1).not.toBe(h2);
    expect(verifyPasscode("1402", h1)).toBe(true);
    expect(verifyPasscode("1403", h1)).toBe(false);
    expect(verifyPasscode("1402", "garbage")).toBe(false);
  });

  it("rejects tampered and expired tokens", () => {
    const t = signToken({ s: "site", v: 1 }, 60);
    expect(readToken<{ s: string }>(t)?.s).toBe("site");
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ s: "other", v: 1, exp: 9e9 })).toString("base64url");
    expect(readToken(`${forged}.${sig}`)).toBeNull();
    expect(readToken(`${body}.${"0".repeat(64)}`)).toBeNull();
    expect(readToken(signToken({ s: "x" }, -1))).toBeNull();
    expect(readToken(undefined)).toBeNull();
  });

  it("compares in constant time and handles length mismatch", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("Razorpay signatures", () => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const hookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  it("verifies the checkout signature (order_id|payment_id)", () => {
    const sig = crypto.createHmac("sha256", keySecret).update("order_A|pay_B").digest("hex");
    expect(verifyCheckoutSignature("order_A", "pay_B", sig)).toBe(true);
    expect(verifyCheckoutSignature("order_A", "pay_C", sig)).toBe(false);
    expect(verifyCheckoutSignature("order_A", "pay_B", sig.replace(/.$/, "0"))).toBe(false);
  });

  it("verifies webhooks over the exact raw body", () => {
    const body = '{"event":"order.paid","payload":{}}';
    const sig = crypto.createHmac("sha256", hookSecret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig)).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig)).toBe(false);
    expect(verifyWebhookSignature(body, null)).toBe(false);
    const wrong = crypto.createHmac("sha256", "not-the-secret").update(body).digest("hex");
    expect(verifyWebhookSignature(body, wrong)).toBe(false);
  });
});

describe("open-redirect protection", () => {
  it.each([
    ["/dashboard/sites/x", "/dashboard/sites/x"],
    ["/checkout?product=1", "/checkout?product=1"],
    ["//evil.com", "/dashboard"],
    ["https://evil.com", "/dashboard"],
    ["/\\evil.com", "/dashboard"],
    ["javascript:alert(1)", "/dashboard"],
    ["/ok\r\nSet-Cookie: x", "/dashboard"],
    [undefined, "/dashboard"],
  ])("%s → %s", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});

describe("PII-safe logging", () => {
  it("redacts personal fields at any depth", () => {
    const out = _scrubForTest({ order: "o1", email: "a@b.c", nested: { contact: "+91", recipientName: "Priya", ok: 1 }, list: [{ passcode: "1234" }] }) as Record<string, unknown>;
    expect(JSON.stringify(out)).not.toMatch(/a@b\.c|\+91|Priya|1234/);
    expect(out.order).toBe("o1");
  });
});

describe("filenames", () => {
  it("are display-only and cleaned of paths and control characters", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename('C:\\Users\\x\\<script>alert(1)</script>.jpg')).toBe("script.jpg");
    expect(sanitizeFilename("a\u202Egpj.exe")).toBe("agpj.exe");
    expect(sanitizeFilename("")).toBe("file");
  });
});
