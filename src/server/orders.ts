import "server-only";
import crypto from "node:crypto";
import { adminDb } from "@/lib/supabase/admin";
import { newSlug } from "./crypto";
import { env } from "./env";
import { ApiError, badRequest, conflict, notFound } from "./http";
import { log } from "./log";
import { paymentSchema, razorpay, refundSchema, verifyCheckoutSignature, verifyWebhookSignature, type RzpPayment } from "./razorpay";

const db = () => adminDb();

async function audit(action: string, targetType: string, targetId: string, meta: Record<string, unknown> = {}, actorId: string | null = null, actorRole: "customer" | "admin" | "system" | "webhook" = "system") {
  await db().from("audit_log").insert({ action, target_type: targetType, target_id: targetId, meta: meta as never, actor_id: actorId, actor_role: actorRole });
}

// ───────────────────────── checkout ─────────────────────────

export type CheckoutSession = {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  productName: string;
};

/** Creates (or reuses a recent unpaid) order. The price always comes from the database. */
export async function createCheckout(userId: string, productId: string): Promise<CheckoutSession> {
  const { data: product } = await db().from("products").select("*").eq("id", productId).eq("is_active", true).maybeSingle();
  if (!product) throw notFound();
  const { data: tv } = await db().from("template_versions").select("version").eq("template_key", product.template_key).eq("is_current", true).maybeSingle();
  if (!tv) throw new ApiError(503, "template_unavailable", "This design is temporarily unavailable.");

  // Reuse an unpaid order for the same product/price from the last 30 minutes (no order spam).
  const since = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data: recent } = await db()
    .from("orders")
    .select("id, razorpay_order_id, amount_paise, currency")
    .eq("user_id", userId)
    .eq("product_id", product.id)
    .eq("status", "created")
    .eq("amount_paise", product.price_paise)
    .not("razorpay_order_id", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent?.razorpay_order_id) {
    return { orderId: recent.id, razorpayOrderId: recent.razorpay_order_id, amount: recent.amount_paise, currency: recent.currency, keyId: env().RAZORPAY_KEY_ID, productName: product.name };
  }

  const receipt = `rcpt_${newSlug(20)}`;
  const { data: order, error } = await db()
    .from("orders")
    .insert({
      user_id: userId,
      product_id: product.id,
      template_key: product.template_key,
      template_version: tv.version,
      amount_paise: product.price_paise,
      currency: product.currency,
      edit_days: product.edit_days,
      live_days: product.live_days,
      receipt,
    })
    .select("id")
    .single();
  if (error || !order) throw error ?? new Error("order insert failed");

  try {
    // Notes carry only our opaque order id — no names or emails go to the provider.
    const rzp = await razorpay.createOrder(product.price_paise, product.currency, receipt, { ref: order.id });
    await db().from("orders").update({ razorpay_order_id: rzp.id }).eq("id", order.id);
    await audit("order.created", "order", order.id, { amount: product.price_paise }, userId, "customer");
    return { orderId: order.id, razorpayOrderId: rzp.id, amount: product.price_paise, currency: product.currency, keyId: env().RAZORPAY_KEY_ID, productName: product.name };
  } catch (e) {
    await db().from("orders").update({ status: "expired", last_payment_error: "provider_order_failed" }).eq("id", order.id);
    throw e;
  }
}

type FulfilResult = { status: string; order_id?: string; site_id?: string };

async function fulfil(rzpOrderId: string, p: Pick<RzpPayment, "id" | "amount" | "currency" | "method">, actor: "checkout" | "webhook" | "reconcile"): Promise<FulfilResult> {
  const { data, error } = await db().rpc("fulfil_order", {
    p_razorpay_order_id: rzpOrderId,
    p_payment_id: p.id,
    p_amount: p.amount,
    p_currency: p.currency,
    p_method: p.method ?? "unknown",
    p_actor: actor,
  });
  if (error) throw error;
  const r = data as FulfilResult;
  if (r.status === "duplicate") await refundDuplicate(p.id, p.amount);
  if (r.status === "amount_mismatch") log.warn("payment.amount_mismatch", { payment: p.id });
  return r;
}

/** A second successful payment for an order that is already paid is returned automatically. */
async function refundDuplicate(paymentId: string, amount: number) {
  try {
    const refund = await razorpay.refund(paymentId, amount, `dup_${paymentId}`.slice(0, 40));
    await db().rpc("apply_refund", { p_payment_id: paymentId, p_refund_id: refund.id, p_amount: refund.amount, p_status: refund.status });
    log.info("payment.duplicate_refunded", { payment: paymentId, refund: refund.id });
  } catch (e) {
    // Leaves the duplicate visible in admin (is_duplicate, no refund) for manual action.
    log.error("payment.duplicate_refund_failed", e, { payment: paymentId });
  }
}

/** Razorpay Checkout success handler → verify signature, confirm with the API, fulfil. */
export async function verifyCheckout(userId: string, input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const { data: order } = await db().from("orders").select("id, status, razorpay_order_id").eq("razorpay_order_id", input.razorpay_order_id).eq("user_id", userId).maybeSingle();
  if (!order) throw notFound();
  if (!verifyCheckoutSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
    await audit("payment.bad_signature", "order", order.id, {}, userId, "customer");
    throw badRequest("Payment could not be verified.");
  }
  // The signature proves Razorpay authorised this payment for this order; the API call
  // confirms it was actually captured and for the right amount.
  const p = await razorpay.fetchPayment(input.razorpay_payment_id);
  if (p.order_id !== input.razorpay_order_id) throw badRequest("Payment does not belong to this order.");
  if (p.status !== "captured") return { status: "pending" as const, orderId: order.id };
  const r = await fulfil(input.razorpay_order_id, p, "checkout");
  if (r.status === "fulfilled" || r.status === "already") return { status: "paid" as const, orderId: order.id, siteId: r.site_id ?? null };
  if (r.status === "duplicate") throw conflict("already_paid", "This order was already paid. The extra payment is being refunded automatically.");
  throw badRequest("Payment could not be applied to this order.");
}

// ───────────────────────── webhooks ─────────────────────────

/** Normalised, PII-free view of an event: exactly what we store and process. */
type EventSummary = {
  type: string;
  payment?: { id: string; order_id: string | null; amount: number; currency: string; status: string; method: string | null; error_code: string | null; error_description: string | null };
  refund?: { id: string; payment_id: string; amount: number; status: "pending" | "processed" | "failed" };
};

function summarise(body: unknown): EventSummary {
  const b = body as { event?: string; payload?: { payment?: { entity?: unknown }; refund?: { entity?: unknown } } };
  if (!b || typeof b.event !== "string") throw badRequest("Malformed event.");
  const out: EventSummary = { type: b.event };
  const pe = b.payload?.payment?.entity;
  if (pe) {
    const p = paymentSchema.parse(pe);
    out.payment = { id: p.id, order_id: p.order_id ?? null, amount: p.amount, currency: p.currency, status: p.status, method: p.method ?? null, error_code: p.error_code ?? null, error_description: p.error_description?.slice(0, 200) ?? null };
  }
  const re = b.payload?.refund?.entity;
  if (re) {
    const r = refundSchema.parse(re);
    out.refund = { id: r.id, payment_id: r.payment_id, amount: r.amount, status: r.status };
  }
  return out;
}

async function processEvent(s: EventSummary): Promise<string> {
  switch (s.type) {
    case "order.paid":
    case "payment.captured": {
      const p = s.payment;
      if (!p?.order_id) return "ignored:no_order";
      if (p.status !== "captured") return "ignored:not_captured";
      const r = await fulfil(p.order_id, { id: p.id, amount: p.amount, currency: p.currency, method: p.method }, "webhook");
      return r.status;
    }
    case "payment.failed": {
      const p = s.payment;
      if (!p?.order_id) return "ignored:no_order";
      const { data: order } = await db().from("orders").select("id").eq("razorpay_order_id", p.order_id).maybeSingle();
      if (!order) return "unknown_order";
      await db().from("payments").upsert(
        { order_id: order.id, razorpay_payment_id: p.id, amount_paise: p.amount, currency: p.currency, status: "failed", method: p.method, error_code: p.error_code, error_description: p.error_description },
        { onConflict: "razorpay_payment_id", ignoreDuplicates: true },
      );
      // The order stays open: Razorpay lets the customer retry on the same order.
      await db().from("orders").update({ last_payment_error: p.error_code ?? "payment_failed" }).eq("id", order.id).eq("status", "created");
      return "recorded_failure";
    }
    case "refund.created":
    case "refund.processed":
    case "refund.failed": {
      const r = s.refund;
      if (!r) return "ignored:no_refund";
      const status = s.type === "refund.processed" ? "processed" : s.type === "refund.failed" ? "failed" : "pending";
      const { data, error } = await db().rpc("apply_refund", { p_payment_id: r.payment_id, p_refund_id: r.id, p_amount: r.amount, p_status: status });
      if (error) throw error;
      return (data as { status: string }).status;
    }
    default:
      return "ignored";
  }
}

export async function handleWebhook(rawBody: string, signature: string | null, eventIdHeader: string | null) {
  if (!verifyWebhookSignature(rawBody, signature)) {
    log.warn("webhook.bad_signature");
    throw new ApiError(401, "bad_signature", "Invalid signature.");
  }
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw badRequest("Malformed JSON.");
  }
  const summary = summarise(body);
  const eventId = eventIdHeader?.slice(0, 100) || `sha256:${crypto.createHash("sha256").update(rawBody).digest("hex")}`;

  const { data: inserted } = await db()
    .from("payment_events")
    .upsert(
      { event_id: eventId, event_type: summary.type, razorpay_order_id: summary.payment?.order_id ?? null, razorpay_payment_id: summary.payment?.id ?? summary.refund?.payment_id ?? null, razorpay_refund_id: summary.refund?.id ?? null, summary: summary as never },
      { onConflict: "event_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  let rowId = inserted?.id;
  if (!rowId) {
    const { data: existing } = await db().from("payment_events").select("id, processed_at").eq("event_id", eventId).single();
    if (existing?.processed_at) return { status: "duplicate_event" };
    rowId = existing?.id;
  }
  return runEvent(rowId!, summary);
}

async function runEvent(rowId: string, summary: EventSummary) {
  try {
    const result = await processEvent(summary);
    await db().from("payment_events").update({ processed_at: new Date().toISOString(), error: null }).eq("id", rowId);
    log.info("webhook.processed", { type: summary.type, result });
    return { status: result };
  } catch (e) {
    const { data: row } = await db().from("payment_events").select("attempts").eq("id", rowId).single();
    await db().from("payment_events").update({ attempts: (row?.attempts ?? 0) + 1, error: e instanceof Error ? e.message.slice(0, 300) : "error" }).eq("id", rowId);
    log.error("webhook.failed", e, { type: summary.type });
    throw new ApiError(500, "processing_failed", "Event processing failed; it will be retried.");
  }
}

/** Admin "reprocess" button and the reconcile job use the stored, normalised summary. */
export async function reprocessEvent(eventRowId: string) {
  const { data } = await db().from("payment_events").select("id, summary, processed_at").eq("id", eventRowId).maybeSingle();
  if (!data) throw notFound();
  return runEvent(data.id, data.summary as EventSummary);
}

// ───────────────────────── refunds (admin) ─────────────────────────

export async function refundOrder(orderId: string, adminId: string, reason: string) {
  const { data: order } = await db().from("orders").select("id, status, amount_paise").eq("id", orderId).maybeSingle();
  if (!order) throw notFound();
  if (order.status !== "paid") throw conflict("not_refundable", `Order is ${order.status}.`);
  const { data: pay } = await db().from("payments").select("razorpay_payment_id, amount_paise").eq("order_id", orderId).eq("status", "captured").eq("is_duplicate", false).maybeSingle();
  if (!pay) throw conflict("no_payment", "No captured payment found for this order.");
  const refund = await razorpay.refund(pay.razorpay_payment_id, pay.amount_paise, `ref_${orderId}`.slice(0, 40));
  await db().rpc("apply_refund", { p_payment_id: pay.razorpay_payment_id, p_refund_id: refund.id, p_amount: refund.amount, p_status: refund.status });
  await audit("admin.refund", "order", orderId, { refund: refund.id, status: refund.status, reason: reason.slice(0, 200) }, adminId, "admin");
  return { refundId: refund.id, status: refund.status };
}

// ───────────────────────── reconciliation (cron) ─────────────────────────

export async function reconcile() {
  const now = Date.now();
  const report = { checked: 0, fulfilled: 0, expired: 0, refundsUpdated: 0, eventsRetried: 0, errors: 0 };

  // 1. Unpaid orders whose webhook may have been missed.
  const { data: open } = await db()
    .from("orders")
    .select("id, razorpay_order_id")
    .eq("status", "created")
    .not("razorpay_order_id", "is", null)
    .lte("created_at", new Date(now - 2 * 60_000).toISOString())
    .gte("created_at", new Date(now - 3 * 86_400_000).toISOString())
    .limit(100);
  for (const o of open ?? []) {
    report.checked++;
    try {
      const pays = await razorpay.orderPayments(o.razorpay_order_id!);
      const captured = pays.find((p) => p.status === "captured");
      if (captured) {
        const r = await fulfil(o.razorpay_order_id!, captured, "reconcile");
        if (r.status === "fulfilled") report.fulfilled++;
      }
    } catch (e) {
      report.errors++;
      log.error("reconcile.order_failed", e, { order: o.id });
    }
  }

  // 2. Abandoned orders.
  const { data: stale } = await db()
    .from("orders")
    .update({ status: "expired" })
    .eq("status", "created")
    .lt("created_at", new Date(now - 3 * 86_400_000).toISOString())
    .select("id");
  report.expired = stale?.length ?? 0;

  // 3. Refunds still pending.
  const { data: pending } = await db().from("payments").select("razorpay_payment_id, razorpay_refund_id").eq("refund_status", "pending").not("razorpay_refund_id", "is", null).limit(100);
  for (const p of pending ?? []) {
    try {
      const r = await razorpay.fetchRefund(p.razorpay_refund_id!);
      if (r.status !== "pending") {
        await db().rpc("apply_refund", { p_payment_id: p.razorpay_payment_id, p_refund_id: r.id, p_amount: r.amount, p_status: r.status });
        report.refundsUpdated++;
      }
    } catch (e) {
      report.errors++;
      log.error("reconcile.refund_failed", e);
    }
  }

  // 4. Webhook events that failed processing.
  const { data: failed } = await db().from("payment_events").select("id").is("processed_at", null).lt("received_at", new Date(now - 5 * 60_000).toISOString()).lt("attempts", 10).limit(50);
  for (const ev of failed ?? []) {
    try {
      await reprocessEvent(ev.id);
      report.eventsRetried++;
    } catch {
      report.errors++;
    }
  }
  return report;
}
