import crypto from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { admin, totp } from "../helpers/db";
import { api, APP, MOCK, newCustomer, RENDERER, stubRazorpay } from "./helpers";

/**
 * Payment flows against the Razorpay mock (which signs exactly like Razorpay). Exercises the
 * real checkout API, verification, the webhook endpoint, refunds and reconciliation.
 */
test.describe.configure({ mode: "serial", timeout: 180_000 });

const mock = async (path: string, body: unknown) => (await fetch(`${MOCK}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();
const db = () => admin();
let page: Page;
let productId: string;

async function startCheckout() {
  const r = await api(page).post("/api/checkout", { productId });
  expect(r.status).toBe(200);
  return r.json as { orderId: string; razorpayOrderId: string; amount: number };
}
async function siteCount(orderId: string) {
  return (await db().from("sites").select("id", { count: "exact", head: true }).eq("order_id", orderId)).count;
}

test.beforeAll(async ({ browser }) => {
  ({ page } = await newCustomer(browser, "pay"));
  productId = (await db().from("products").select("id").eq("is_active", true).limit(1).single()).data!.id;
});

test("an authorized (not yet captured) payment is captured after verification, then fulfilled once", async () => {
  const s = await startCheckout();
  const paid = await mock("/test/pay", { order_id: s.razorpayOrderId, outcome: "authorized", webhook: false });
  // A forged signature must not trigger a capture.
  const bad = await api(page).post("/api/checkout/verify", { ...paid, razorpay_signature: "0".repeat(64) });
  expect(bad.status).toBe(400);
  let state = (await (await fetch(`${MOCK}/test/state`)).json()) as { payments: { id: string; status: string }[] };
  expect(state.payments.find((p) => p.id === paid.razorpay_payment_id)!.status).toBe("authorized");
  // The real signature: captured on the server, then the order is fulfilled.
  const ok = await api(page).post("/api/checkout/verify", paid);
  expect(ok.json).toMatchObject({ status: "paid" });
  state = (await (await fetch(`${MOCK}/test/state`)).json()) as { payments: { id: string; status: string }[] };
  expect(state.payments.find((p) => p.id === paid.razorpay_payment_id)!.status).toBe("captured");
  expect(await siteCount(s.orderId)).toBe(1);
  const again = await api(page).post("/api/checkout/verify", paid);
  expect(again.json).toMatchObject({ status: "paid" });
  expect(await siteCount(s.orderId)).toBe(1);
});

test("the price always comes from the database", async () => {
  const r = await api(page).post("/api/checkout", { productId, amount: 1, price_paise: 1, currency: "USD" });
  expect(r.status).toBe(200);
  const { data: p } = await db().from("products").select("price_paise").eq("id", productId).single();
  expect((r.json as { amount: number }).amount).toBe(p!.price_paise);
  const state = (await (await fetch(`${MOCK}/test/state`)).json()) as { orders: { id: string; amount: number; notes: Record<string, string> }[] };
  const o = state.orders.find((x) => x.id === (r.json as { razorpayOrderId: string }).razorpayOrderId)!;
  expect(o.amount).toBe(p!.price_paise);
  // Only an opaque reference goes to the provider — no names or emails.
  expect(Object.keys(o.notes)).toEqual(["ref"]);
  expect((await api(page).post("/api/checkout", { productId: crypto.randomUUID() })).status).toBe(404);
});

test("payment failure keeps the order open, creates no site, and a retry succeeds", async () => {
  const s = await startCheckout();
  const fail = await mock("/test/pay", { order_id: s.razorpayOrderId, outcome: "fail" });
  expect(fail.error).toBeTruthy();
  const { data: o } = await db().from("orders").select("status, last_payment_error").eq("id", s.orderId).single();
  expect(o).toEqual({ status: "created", last_payment_error: "BAD_REQUEST_ERROR" });
  expect(await siteCount(s.orderId)).toBe(0);
  const ok = await mock("/test/pay", { order_id: s.razorpayOrderId });
  const v = await api(page).post("/api/checkout/verify", ok);
  expect(v.json).toMatchObject({ status: "paid" });
  expect(await siteCount(s.orderId)).toBe(1);
});

test("duplicate webhook deliveries are processed once", async () => {
  const s = await startCheckout();
  const eventId = `evt_dup_${crypto.randomBytes(5).toString("hex")}`;
  const paid = await mock("/test/pay", { order_id: s.razorpayOrderId, eventId });
  expect(paid.delivered.status).toBe(200);
  for (let i = 0; i < 3; i++) {
    const again = await mock("/test/replay", { eventId });
    expect(again.status).toBe(200);
    expect(JSON.parse(again.body).status).toBe("duplicate_event");
  }
  expect(await siteCount(s.orderId)).toBe(1);
  expect((await db().from("payment_events").select("id", { count: "exact", head: true }).eq("event_id", eventId)).count).toBe(1);
});

test("checkout callback and webhook racing each other create exactly one site", async () => {
  const s = await startCheckout();
  const paid = await mock("/test/pay", { order_id: s.razorpayOrderId, webhook: false });
  const sigHook = mock("/test/send", {
    event: "order.paid",
    payload: { payment: { entity: { id: paid.razorpay_payment_id, amount: s.amount, currency: "INR", status: "captured", order_id: s.razorpayOrderId, method: "upi" } } },
  });
  const verifies = Array.from({ length: 3 }, () => api(page).post("/api/checkout/verify", paid));
  const [hook, ...vs] = await Promise.all([sigHook, ...verifies]);
  expect(hook.status).toBe(200);
  for (const v of vs) expect(v.json).toMatchObject({ status: "paid" });
  expect(await siteCount(s.orderId)).toBe(1);
  expect((await db().from("payments").select("id", { count: "exact", head: true }).eq("order_id", s.orderId)).count).toBe(1);
});

test("a second successful payment for the same order is refunded automatically", async () => {
  const s = await startCheckout();
  await mock("/test/pay", { order_id: s.razorpayOrderId });
  const second = await mock("/test/pay", { order_id: s.razorpayOrderId });
  expect(second.delivered.status).toBe(200);
  const { data: dup } = await db().from("payments").select("is_duplicate, refund_status, razorpay_refund_id").eq("razorpay_payment_id", second.razorpay_payment_id).single();
  expect(dup).toMatchObject({ is_duplicate: true, refund_status: "pending" });
  expect(dup!.razorpay_refund_id).toMatch(/^rfnd_/);
  expect(await siteCount(s.orderId)).toBe(1);
  // The original order is untouched by the duplicate's refund.
  await mock("/test/refund-complete", { refund_id: dup!.razorpay_refund_id });
  expect((await db().from("orders").select("status").eq("id", s.orderId).single()).data!.status).toBe("paid");
});

test("forged or tampered webhooks are rejected", async () => {
  const s = await startCheckout();
  const forged = await mock("/test/send", {
    tamper: true,
    event: "order.paid",
    payload: { payment: { entity: { id: "pay_forged0001", amount: s.amount, currency: "INR", status: "captured", order_id: s.razorpayOrderId, method: "upi" } } },
  });
  expect(forged.status).toBe(401);
  const raw = JSON.stringify({ event: "order.paid", payload: {} });
  const r = await fetch(`${APP}/api/webhooks/razorpay`, { method: "POST", headers: { "content-type": "application/json" }, body: raw });
  expect(r.status).toBe(401);
  expect(await siteCount(s.orderId)).toBe(0);
});

test("a payment for the wrong amount does not fulfil the order", async () => {
  const s = await startCheckout();
  const r = await mock("/test/pay", { order_id: s.razorpayOrderId, outcome: "wrong_amount" });
  expect(JSON.parse(r.delivered.body).status).toBe("amount_mismatch");
  expect((await db().from("orders").select("status").eq("id", s.orderId).single()).data!.status).toBe("created");
  expect(await siteCount(s.orderId)).toBe(0);
});

test("checkout verification rejects bad signatures and other people's orders", async ({ browser }) => {
  const s = await startCheckout();
  const paid = await mock("/test/pay", { order_id: s.razorpayOrderId, webhook: false });
  const bad = await api(page).post("/api/checkout/verify", { ...paid, razorpay_signature: "0".repeat(64) });
  expect(bad.status).toBe(400);
  const other = await newCustomer(browser, "pay-other");
  const stolen = await api(other.page).post("/api/checkout/verify", paid);
  expect(stolen.status).toBe(404);
  expect(await siteCount(s.orderId)).toBe(0);
  await other.context.close();
});

test("a missed webhook is recovered by the reconciliation job (which requires the cron secret)", async () => {
  const s = await startCheckout();
  await mock("/test/pay", { order_id: s.razorpayOrderId, webhook: false });
  await db().from("orders").update({ created_at: new Date(Date.now() - 5 * 60_000).toISOString() }).eq("id", s.orderId);
  expect((await fetch(`${APP}/api/cron/reconcile`)).status).toBe(401);
  expect((await fetch(`${APP}/api/cron/reconcile`, { headers: { authorization: "Bearer wrong" } })).status).toBe(401);
  const r = await fetch(`${APP}/api/cron/reconcile`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
  expect(r.status).toBe(200);
  expect(((await r.json()) as { fulfilled: number }).fulfilled).toBeGreaterThanOrEqual(1);
  expect(await siteCount(s.orderId)).toBe(1);
});

test("admin refund: refund → webhook → order refunded and the site's link stops working", async ({ browser }) => {
  // Buyer with a published site
  const s = await startCheckout();
  await mock("/test/pay", { order_id: s.razorpayOrderId });
  const { data: site } = await db().from("sites").select("id, draft_content, draft_revision").eq("order_id", s.orderId).single();
  const content = { ...(site!.draft_content as object), recipientName: "Refund Test", senderName: "Me" };
  expect((await api(page).put(`/api/sites/${site!.id}/draft`, { content, revision: site!.draft_revision })).status).toBe(200);
  const pub = await api(page).post(`/api/sites/${site!.id}/publish`);
  const url = `${RENDERER}/birthday/${(pub.json as { slug: string }).slug}`;
  expect((await fetch(url)).status).toBe(200);

  // An admin with MFA issues the refund through the admin API.
  const ad = await newCustomer(browser, "pay-admin");
  const { data: u } = await db().from("profiles").select("id").eq("email", ad.email).single();
  await db().from("profiles").update({ role: "admin" }).eq("id", u!.id);
  const noMfa = await api(ad.page).post(`/api/admin/orders/${s.orderId}/refund`, { reason: "customer asked" });
  expect(noMfa.status).toBe(403);
  expect(noMfa.json).toMatchObject({ error: { code: "mfa_required" } });
  await ad.page.goto(`${APP}/admin/mfa`);
  const secret = (await ad.page.getByTestId("totp-secret").textContent())!.trim();
  await ad.page.locator('input[name="totp"]').fill(totp(secret));
  await ad.page.getByRole("button", { name: "Verify" }).click();
  await ad.page.waitForURL(`${APP}/admin`);
  const refund = await api(ad.page).post(`/api/admin/orders/${s.orderId}/refund`, { reason: "customer asked" });
  expect(refund.status).toBe(200);
  expect((await db().from("orders").select("status").eq("id", s.orderId).single()).data!.status).toBe("refund_pending");
  await mock("/test/refund-complete", { refund_id: (refund.json as { refundId: string }).refundId });
  expect((await db().from("orders").select("status").eq("id", s.orderId).single()).data!.status).toBe("refunded");
  expect((await db().from("sites").select("status").eq("id", site!.id).single()).data!.status).toBe("disabled");
  expect((await fetch(url)).status).toBe(404);
  // Customer cannot republish a refunded site.
  expect((await api(page).post(`/api/sites/${site!.id}/publish`)).status).toBe(423);
  // The refund is in the audit log.
  const { data: log } = await db().from("audit_log").select("action").eq("target_id", s.orderId);
  expect(log!.map((l) => l.action)).toEqual(expect.arrayContaining(["admin.refund", "refund.processed"]));
  await ad.context.close();
});

test("checkout UI: failed payment shows the reason; closing the checkout re-enables Pay; nothing is marked paid", async ({ browser }) => {
  const c = await newCustomer(browser, "pay-ui");
  let outcome: "fail" | "dismiss" = "fail";
  await stubRazorpay(c.page, () => outcome);
  await c.page.goto(`${APP}/product`);
  await c.page.getByRole("link", { name: "Buy now" }).click();
  await c.page.getByTestId("pay").click();
  await expect(c.page.getByRole("alert").filter({ hasText: "Payment failed" })).toContainText("You haven't been charged");
  await expect(c.page.getByRole("alert").filter({ hasText: "Payment failed" })).not.toContainText("..");
  outcome = "dismiss";
  await c.page.reload();
  await c.page.getByTestId("pay").click();
  await expect(c.page.getByTestId("pay")).toBeEnabled();
  await expect(c.page.getByTestId("pay")).toHaveText(/^Pay /);
  const { data: u } = await db().from("profiles").select("id").eq("email", c.email).single();
  const { data: orders } = await db().from("orders").select("status").eq("user_id", u!.id);
  expect(orders!.every((o) => o.status === "created")).toBe(true);
  await c.context.close();
});
