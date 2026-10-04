import "server-only";
import { z } from "zod";
import { hmacHex, safeEqual } from "./crypto";
import { env } from "./env";
import { ApiError } from "./http";

/**
 * Minimal Razorpay REST client (orders, payments, refunds) + signature checks.
 * Plain fetch keeps the API base configurable so tests can run against a local mock; the env
 * schema forbids a non-Razorpay base outside local development.
 */

const orderSchema = z.object({ id: z.string(), amount: z.number(), currency: z.string(), receipt: z.string().nullable().optional(), status: z.string() });
export const paymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(["created", "authorized", "captured", "refunded", "failed"]),
  order_id: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
  captured: z.boolean().optional(),
  error_code: z.string().nullable().optional(),
  error_description: z.string().nullable().optional(),
});
export const refundSchema = z.object({ id: z.string(), amount: z.number(), payment_id: z.string(), status: z.enum(["pending", "processed", "failed"]) });

export type RzpPayment = z.infer<typeof paymentSchema>;
export type RzpRefund = z.infer<typeof refundSchema>;

async function call<T>(method: "GET" | "POST", path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
  const e = env();
  const auth = Buffer.from(`${e.RAZORPAY_KEY_ID}:${e.RAZORPAY_KEY_SECRET}`).toString("base64");
  let res: Response;
  try {
    res = await fetch(`${e.RAZORPAY_API_BASE}${path}`, {
      method,
      headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(502, "payment_provider_unreachable", "The payment provider is not responding. Please try again.");
  }
  const text = await res.text();
  if (!res.ok) {
    let code = "payment_provider_error";
    try {
      code = (JSON.parse(text) as { error?: { code?: string } }).error?.code ?? code;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(502, "payment_provider_error", "The payment provider rejected the request.", { providerCode: code, providerStatus: res.status });
  }
  return schema.parse(JSON.parse(text));
}

export const razorpay = {
  createOrder: (amountPaise: number, currency: string, receipt: string, notes: Record<string, string>) =>
    call("POST", "/v1/orders", orderSchema, { amount: amountPaise, currency, receipt, notes, payment_capture: 1 }),
  fetchPayment: (paymentId: string) => call("GET", `/v1/payments/${encodeURIComponent(paymentId)}`, paymentSchema),
  orderPayments: (orderId: string) =>
    call("GET", `/v1/orders/${encodeURIComponent(orderId)}/payments`, z.object({ items: z.array(paymentSchema) })).then((r) => r.items),
  refund: (paymentId: string, amountPaise: number, receipt: string) =>
    call("POST", `/v1/payments/${encodeURIComponent(paymentId)}/refund`, refundSchema, { amount: amountPaise, speed: "normal", receipt }),
  fetchRefund: (refundId: string) => call("GET", `/v1/refunds/${encodeURIComponent(refundId)}`, refundSchema),
};

/** Checkout success callback: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  return safeEqual(hmacHex(env().RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), signature);
}

/** Webhook: HMAC_SHA256(raw body, webhook secret) — computed over the exact bytes received. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  return safeEqual(hmacHex(env().RAZORPAY_WEBHOOK_SECRET, rawBody), signature);
}
