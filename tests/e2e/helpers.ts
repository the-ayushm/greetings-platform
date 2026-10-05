import crypto from "node:crypto";
import { expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";
import "../helpers/load-env";

export const APP = process.env.APP_ORIGIN ?? "http://app.localhost:3000";
export const RENDERER = process.env.RENDERER_ORIGIN ?? "http://wishes.localhost:3000";
export const MOCK = "http://127.0.0.1:4010";
const MAILPIT = "http://127.0.0.1:54324";

export const uid = () => crypto.randomBytes(4).toString("hex");
export const email = (tag: string) => `${tag}-${uid()}@example.com`;

/** Reads the newest sign-in link sent to this address from the local mail catcher. */
export async function linkFor(address: string, after: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`);
    const j = (await r.json()) as { messages?: { ID: string; Created: string }[] };
    const msg = (j.messages ?? []).find((m) => new Date(m.Created).getTime() >= after - 2000);
    if (msg) {
      const full = (await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json()) as { HTML?: string; Text?: string };
      const m = (full.HTML ?? full.Text ?? "").match(/href="([^"]*\/auth\/v1\/verify[^"]*)"/);
      if (m) return m[1]!.replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no sign-in email for ${address}`);
}

/** Real sign-in flow: email → "Check your email" → click the emailed link → /auth/callback → session. */
export async function login(page: Page, address: string, next = "/dashboard") {
  await page.goto(`${APP}/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(address);
  const t = Date.now();
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.goto(await linkFor(address, t));
  await page.waitForURL((u) => u.origin === APP && !u.pathname.startsWith("/login") && !u.pathname.startsWith("/auth/"));
}

/**
 * Stand-in for Razorpay's checkout.js: the real widget can't run without real keys, so the test
 * serves a tiny stub at the same URL. It asks the local mock to "pay" — which signs the result
 * with the key secret and delivers a signed webhook to the app, like Razorpay does.
 */
export async function stubRazorpay(page: Page, outcome: () => "success" | "fail" | "dismiss" = () => "success") {
  await page.exposeFunction("__rzpTestPay", async (orderId: string) => {
    if (outcome() === "dismiss") return { dismissed: true };
    const r = await fetch(`${MOCK}/test/pay`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ order_id: orderId, outcome: outcome() }) });
    return r.json();
  });
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.Razorpay=function(o){this.o=o;this.h={}};
window.Razorpay.prototype.on=function(e,f){this.h[e]=f};
window.Razorpay.prototype.open=async function(){var r=await window.__rzpTestPay(this.o.order_id);
 if(r.dismissed){this.o.modal&&this.o.modal.ondismiss&&this.o.modal.ondismiss()}
 else if(r.error){this.h["payment.failed"]&&this.h["payment.failed"]({error:r.error})}else{this.o.handler(r)}};`,
    }),
  );
}

/** Buys a site through the real UI and returns its id. */
export async function buySite(page: Page): Promise<string> {
  await stubRazorpay(page);
  await page.goto(`${APP}/product`);
  await page.getByRole("link", { name: "Buy now" }).click();
  await page.getByTestId("pay").click();
  await page.waitForURL(/\/dashboard\/orders\//);
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("start-editing").click();
  await page.waitForURL(/\/dashboard\/sites\/[0-9a-f-]+\/edit/);
  return page.url().match(/sites\/([0-9a-f-]{36})/)![1]!;
}

/** Calls our API with this browser's cookies and a same-origin Origin header. */
export function api(ctx: { request: APIRequestContext }, origin = APP) {
  const call = async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await ctx.request.fetch(path.startsWith("http") ? path : `${origin}${path}`, {
      method,
      headers: { origin, ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers },
      data: body !== undefined ? JSON.stringify(body) : undefined,
      maxRedirects: 0,
    });
    let json: Record<string, unknown> = {};
    try {
      json = await res.json();
    } catch {
      /* not JSON */
    }
    return { status: res.status(), json };
  };
  return {
    get: (p: string) => call("GET", p),
    post: (p: string, b?: unknown, h?: Record<string, string>) => call("POST", p, b ?? {}, h),
    put: (p: string, b?: unknown) => call("PUT", p, b),
    del: (p: string, b?: unknown) => call("DELETE", p, b ?? {}),
    raw: call,
  };
}

export async function newCustomer(browser: Browser, tag: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const address = email(tag);
  await login(page, address);
  return { context, page, email: address };
}

export async function recipient(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  return { context, page: await context.newPage() };
}

/** Direct-to-storage upload exactly like the editor does (create → PUT signed URL → complete). */
export async function uploadFile(page: Page, siteId: string, kind: "image" | "audio", bytes: Buffer, mime: string, filename: string, rights = true): Promise<{ stage: string; status: number; json: Record<string, unknown>; assetId?: string }> {
  const a = api(page);
  const created = await a.post(`/api/sites/${siteId}/assets`, { kind, mime, bytes: bytes.length, filename, rightsConfirmed: rights });
  if (created.status !== 200) return { stage: "create", ...created };
  const { path, token, assetId } = created.json as { path: string; token: string; assetId: string };
  const up = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/media/${path}?token=${token}`, {
    method: "PUT",
    headers: { "content-type": mime, "x-upsert": "false" },
    body: new Uint8Array(bytes),
  });
  if (!up.ok) return { stage: "upload", status: up.status, json: { text: await up.text() }, assetId };
  const done = await a.post(`/api/assets/${assetId}/complete`);
  return { stage: "complete", ...done, assetId };
}
