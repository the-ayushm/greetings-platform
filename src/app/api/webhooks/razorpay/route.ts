import { json, route } from "@/server/http";
import { handleWebhook } from "@/server/orders";

export const dynamic = "force-dynamic";

/** Razorpay → us. Authenticated by HMAC signature over the raw body; idempotent by event id. */
export const POST = route(async (req) => {
  const raw = await req.text();
  if (raw.length > 256 * 1024) return json({ error: { code: "too_large" } }, 413);
  const result = await handleWebhook(raw, req.headers.get("x-razorpay-signature"), req.headers.get("x-razorpay-event-id"));
  return json({ ok: true, ...result });
});
