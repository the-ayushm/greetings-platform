// Local stand-in for the Razorpay REST API, used ONLY by automated tests and local dev
// (RAZORPAY_API_BASE=http://127.0.0.1:4010). It implements the endpoints the app calls,
// signs checkout callbacks and webhooks exactly like Razorpay (HMAC-SHA256), and exposes
// /test/* controls so tests can drive payments, failures, duplicates, replays and refunds.
// It never talks to Razorpay and holds no real credentials.
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";

function loadEnv() {
  const out = {};
  for (const f of [".env.local", ".env.test"]) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2];
    }
  }
  return { ...out, ...process.env };
}
const ENV = loadEnv();
const KEY_ID = ENV.RAZORPAY_KEY_ID;
const KEY_SECRET = ENV.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = ENV.RAZORPAY_WEBHOOK_SECRET;
const WEBHOOK_URL = `${ENV.APP_ORIGIN ?? "http://app.localhost:3000"}/api/webhooks/razorpay`;
const PORT = Number(ENV.RAZORPAY_MOCK_PORT ?? 4010);

const orders = new Map();
const payments = new Map();
const refunds = new Map();
const sentEvents = new Map(); // event id -> raw body (for replay tests)
const id = (p) => `${p}_${crypto.randomBytes(7).toString("hex")}`;
const hmac = (secret, s) => crypto.createHmac("sha256", secret).update(s).digest("hex");

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
const err = (res, status, code, description) => send(res, status, { error: { code, description } });

async function readBody(req) {
  let s = "";
  for await (const c of req) s += c;
  return s ? JSON.parse(s) : {};
}

function authed(req) {
  const h = req.headers.authorization ?? "";
  const expected = "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  return h === expected;
}

async function deliver(event, payload, { eventId = id("evt"), tamper = false } = {}) {
  const body = JSON.stringify({ entity: "event", account_id: "acc_mock", event, contains: Object.keys(payload), payload, created_at: Math.floor(Date.now() / 1000) });
  sentEvents.set(eventId, body);
  const signature = tamper ? hmac("wrong-secret-xxxxxxxx", body) : hmac(WEBHOOK_SECRET, body);
  const r = await fetch(WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", "x-razorpay-signature": signature, "x-razorpay-event-id": eventId }, body });
  return { eventId, status: r.status, body: await r.text() };
}

function paymentEntity(p) {
  // Real payloads include contact details; keep them here so tests prove we don't store them.
  return { ...p, entity: "payment", email: "payer@example.com", contact: "+919999999999", captured: p.status === "captured" };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const p = url.pathname;
    if (p === "/health") return send(res, 200, { ok: true });

    // ───────── test controls ─────────
    if (p === "/test/pay" && req.method === "POST") {
      const { order_id, outcome = "success", webhook = true, delayMs = 0, eventId } = await readBody(req);
      const o = orders.get(order_id);
      if (!o) return err(res, 404, "BAD_REQUEST_ERROR", "order not found");
      const pay = { id: id("pay"), amount: o.amount, currency: o.currency, order_id, method: "upi", status: outcome === "fail" ? "failed" : outcome === "authorized" ? "authorized" : "captured", error_code: null, error_description: null, created_at: Math.floor(Date.now() / 1000) };
      if (outcome === "fail") Object.assign(pay, { error_code: "BAD_REQUEST_ERROR", error_description: "Payment failed due to insufficient funds" });
      if (outcome === "wrong_amount") pay.amount = o.amount - 100;
      payments.set(pay.id, pay);
      if (pay.status === "captured") o.status = "paid";
      let delivered = null;
      if (webhook) {
        const go = async () => {
          if (pay.status === "captured") return deliver("order.paid", { payment: { entity: paymentEntity(pay) }, order: { entity: { ...o, entity: "order" } } }, { eventId });
          if (pay.status === "failed") return deliver("payment.failed", { payment: { entity: paymentEntity(pay) } }, { eventId });
          return null;
        };
        if (delayMs) setTimeout(() => void go().catch(() => undefined), delayMs);
        else delivered = await go();
      }
      if (pay.status === "failed") return send(res, 200, { error: { code: pay.error_code, description: pay.error_description, metadata: { order_id, payment_id: pay.id } }, payment_id: pay.id, delivered });
      return send(res, 200, { razorpay_order_id: order_id, razorpay_payment_id: pay.id, razorpay_signature: hmac(KEY_SECRET, `${order_id}|${pay.id}`), delivered });
    }
    if (p === "/test/replay" && req.method === "POST") {
      const { eventId } = await readBody(req);
      const body = sentEvents.get(eventId);
      if (!body) return err(res, 404, "NOT_FOUND", "unknown event");
      const r = await fetch(WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", "x-razorpay-signature": hmac(WEBHOOK_SECRET, body), "x-razorpay-event-id": eventId }, body });
      return send(res, 200, { status: r.status, body: await r.text() });
    }
    if (p === "/test/send" && req.method === "POST") {
      // Arbitrary event (e.g. tampered signature or forged payload) for negative tests.
      const { event, payload, tamper, eventId } = await readBody(req);
      return send(res, 200, await deliver(event, payload, { tamper, eventId }));
    }
    if (p === "/test/refund-complete" && req.method === "POST") {
      const { refund_id, status = "processed" } = await readBody(req);
      const r = refunds.get(refund_id);
      if (!r) return err(res, 404, "NOT_FOUND", "unknown refund");
      r.status = status;
      const pay = payments.get(r.payment_id);
      if (status === "processed" && pay) pay.status = "refunded";
      const d = await deliver(status === "processed" ? "refund.processed" : "refund.failed", { refund: { entity: { ...r, entity: "refund" } }, payment: { entity: paymentEntity(pay) } });
      return send(res, 200, d);
    }
    if (p === "/test/state") return send(res, 200, { orders: [...orders.values()], payments: [...payments.values()], refunds: [...refunds.values()] });

    // ───────── Razorpay API surface ─────────
    if (!authed(req)) return err(res, 401, "BAD_REQUEST_ERROR", "Authentication failed");

    if (p === "/v1/orders" && req.method === "POST") {
      const b = await readBody(req);
      if (!Number.isInteger(b.amount) || b.amount < 100) return err(res, 400, "BAD_REQUEST_ERROR", "amount invalid");
      const o = { id: id("order"), amount: b.amount, amount_paid: 0, currency: b.currency, receipt: b.receipt, notes: b.notes ?? {}, status: "created", attempts: 0, created_at: Math.floor(Date.now() / 1000) };
      orders.set(o.id, o);
      return send(res, 200, { ...o, entity: "order" });
    }
    let m;
    if ((m = p.match(/^\/v1\/orders\/([^/]+)\/payments$/)) && req.method === "GET") {
      if (!orders.has(m[1])) return err(res, 400, "BAD_REQUEST_ERROR", "The id provided does not exist");
      return send(res, 200, { entity: "collection", count: 0, items: [...payments.values()].filter((x) => x.order_id === m[1]).map(paymentEntity) });
    }
    if ((m = p.match(/^\/v1\/payments\/([^/]+)$/)) && req.method === "GET") {
      const pay = payments.get(m[1]);
      return pay ? send(res, 200, paymentEntity(pay)) : err(res, 400, "BAD_REQUEST_ERROR", "The id provided does not exist");
    }
    if ((m = p.match(/^\/v1\/payments\/([^/]+)\/refund$/)) && req.method === "POST") {
      const pay = payments.get(m[1]);
      if (!pay || pay.status !== "captured") return err(res, 400, "BAD_REQUEST_ERROR", "payment not refundable");
      const b = await readBody(req);
      const r = { id: id("rfnd"), amount: b.amount ?? pay.amount, payment_id: pay.id, currency: pay.currency, status: "pending", receipt: b.receipt ?? null, created_at: Math.floor(Date.now() / 1000) };
      refunds.set(r.id, r);
      return send(res, 200, { ...r, entity: "refund" });
    }
    if ((m = p.match(/^\/v1\/refunds\/([^/]+)$/)) && req.method === "GET") {
      const r = refunds.get(m[1]);
      return r ? send(res, 200, { ...r, entity: "refund" }) : err(res, 400, "BAD_REQUEST_ERROR", "The id provided does not exist");
    }
    return err(res, 404, "NOT_FOUND", "no such endpoint");
  } catch (e) {
    return err(res, 500, "SERVER_ERROR", String(e));
  }
});

server.listen(PORT, "127.0.0.1", () => process.stdout.write(`razorpay mock on http://127.0.0.1:${PORT}\n`));
