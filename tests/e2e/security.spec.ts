import { expect, test, type Page } from "@playwright/test";
import { DEMO_CONTENT } from "@/templates/scrapbook/defaults";
import { admin } from "../helpers/db";
import { api, APP, buySite, newCustomer, recipient, RENDERER } from "./helpers";

test.describe.configure({ mode: "serial", timeout: 180_000 });

let page: Page;
let siteId: string;
let url: string;
const XSS = ['<img src=x onerror="window.__pwned=1">', "</script><script>window.__pwned=1</script>", "javascript:window.__pwned=1", "{{constructor.constructor('window.__pwned=1')()}}"];

test.beforeAll(async ({ browser }) => {
  ({ page } = await newCustomer(browser, "sec"));
  siteId = await buySite(page);
  const content = structuredClone(DEMO_CONTENT);
  content.recipientName = XSS[0]!.slice(0, 40);
  content.senderName = XSS[2]!.slice(0, 40);
  content.letter.greeting = XSS[1]!;
  content.letter.body = [XSS.join(" ")];
  content.coupons[0]!.title = "<b>bold</b>";
  content.coupons[0]!.message = XSS[3]!;
  content.final.heading = '"><svg onload=window.__pwned=1>';
  const { data } = await admin().from("sites").select("draft_revision").eq("id", siteId).single();
  expect((await api(page).put(`/api/sites/${siteId}/draft`, { content, revision: data!.draft_revision })).status).toBe(200);
  const pub = await api(page).post(`/api/sites/${siteId}/publish`);
  url = (pub.json as { url: string }).url;
});

test("customer text containing HTML/script is shown as text and never executes", async ({ browser }) => {
  const r = await recipient(browser);
  const dialogs: string[] = [];
  r.page.on("dialog", (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  await r.page.goto(url);
  await r.page.waitForSelector("#app[data-hydrated]");
  await expect(r.page.locator(".cover-name")).toContainText("<img src=x");
  await r.page.click('#cover [data-go="quiz"]');
  for (let i = 0; i < 3; i++) {
    await r.page.locator("#qBody [data-a]").first().click();
    await r.page.waitForTimeout(1300);
  }
  await r.page.click('#qBody [data-go="menu"]');
  await r.page.waitForTimeout(1100);
  await r.page.click('#menu [data-card="letter"]');
  await r.page.waitForTimeout(1100);
  await r.page.click("#lenv");
  await r.page.waitForTimeout(3000);
  await expect(r.page.locator(".l-greet")).toHaveText(XSS[1]!);
  expect(await r.page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  expect(await r.page.locator("#sheet img, #sheet script, #app svg[onload]").count()).toBe(0);
  expect(dialogs).toEqual([]);
  // The preview inside the editor is equally inert.
  await page.goto(`${APP}/dashboard/sites/${siteId}/edit`);
  const pv = page.frameLocator('iframe[title="Live preview of your birthday site"]');
  await expect(pv.locator(".cover-name")).toContainText("<img src=x");
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  await r.context.close();
});

test("CSP blocks injected HTML (inline handlers, parser-inserted scripts) on both origins", async ({ browser }) => {
  for (const target of [url, `${APP}/`]) {
    const r = await recipient(browser);
    const violations: string[] = [];
    r.page.on("console", (m) => {
      if (/Content Security Policy/i.test(m.text())) violations.push(m.text());
    });
    await r.page.goto(target);
    // What a successful HTML injection would look like: event-handler attributes and inline script tags.
    await r.page.evaluate(() => {
      document.body.insertAdjacentHTML("beforeend", '<img src="data:," onerror="window.__injected=1"><svg onload="window.__injected=2"></svg>');
      const f = document.createElement("iframe");
      document.body.appendChild(f);
      document.body.insertAdjacentHTML("beforeend", "<div id=__x></div>");
      document.getElementById("__x")!.innerHTML = "<script>window.__injected=3</script>";
    });
    await r.page.evaluate(() => new Promise((res) => setTimeout(res, 300)));
    expect(await r.page.evaluate(() => (window as unknown as { __injected?: number }).__injected)).toBeUndefined();
    expect(violations.length).toBeGreaterThan(0);
    await r.context.close();
  }
});

test("security headers on the renderer and the app", async ({ request }) => {
  const r = await request.get(url);
  const h = r.headers();
  expect(h["content-security-policy"]).toContain("default-src 'none'");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["referrer-policy"]).toBe("no-referrer");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-robots-tag"]).toContain("noindex");
  expect(h["cross-origin-opener-policy"]).toBe("same-origin");
  // next dev rewrites Cache-Control on dynamic pages; the production build must say no-store.
  expect(h["cache-control"]).toMatch(process.env.PW_SERVER === "prod" ? /no-store/ : /no-store|no-cache/);
  expect(h["set-cookie"] ?? "").not.toContain("sb-");
  const body = await r.text();
  expect(body).toContain('content="noindex, nofollow');
  // Link previews show nothing personal.
  expect(body).toContain('property="og:title" content="A birthday surprise for you ♡"');
  const a = (await request.get(`${APP}/`)).headers();
  expect(a["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(a["x-frame-options"]).toBe("SAMEORIGIN");
  expect((await request.get(`${APP}/dashboard`, { maxRedirects: 0 })).headers()["x-robots-tag"]).toContain("noindex");
  expect(await (await request.get(`${RENDERER}/robots.txt`)).text()).toContain("Disallow: /");
});

test("each origin serves only its own surface", async ({ request }) => {
  const slug = url.split("/").pop()!;
  expect((await request.get(`${APP}/birthday/${slug}`)).status()).toBe(404);
  for (const p of ["/", "/dashboard", "/admin", "/login", "/api/health", "/api/checkout", `/preview/${siteId}`, "/demo"]) {
    expect((await request.get(`${RENDERER}${p}`, { maxRedirects: 0 })).status(), p).toBe(404);
  }
  const r = await request.post(`${APP}/api/r/unlock`, { headers: { origin: APP, "content-type": "application/json" }, data: { slug, passcode: "1234" } });
  expect(r.status()).toBe(404);
  const evil = await request.get(`http://127.0.0.1:3000/`, { headers: { host: "evil.example" } }).catch(() => null);
  if (evil) expect(evil.status()).toBe(421);
});

test("expired, disabled and unknown links all look identical", async ({ request, page: visitor }) => {
  const db = admin();
  const slug = url.split("/").pop()!;
  const shapes: string[] = [];
  const grab = async (u: string) => {
    const r = await visitor.goto(u);
    expect(r!.status()).toBe(404);
    // What a visitor sees must be identical whatever the reason.
    shapes.push(await visitor.locator("main").innerText());
  };
  await db.from("sites").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("id", siteId);
  await grab(url);
  await db.from("sites").update({ expires_at: new Date(Date.now() + 86_400_000).toISOString(), status: "disabled" }).eq("id", siteId);
  await grab(url);
  await grab(`${RENDERER}/birthday/${"Z".repeat(22)}`);
  await grab(`${RENDERER}/birthday/short`);
  await db.from("sites").update({ status: "published" }).eq("id", siteId);
  expect((await request.get(url)).status()).toBe(200);
  expect(shapes[0]).toContain("This surprise isn");
  expect(new Set(shapes).size).toBe(1);
  void slug;
});

test("passcode guessing is rate-limited", async ({ request }) => {
  await api(page).put(`/api/sites/${siteId}/passcode`, { passcode: "8642" });
  const slug = url.split("/").pop()!;
  const statuses: number[] = [];
  for (let i = 0; i < 8; i++) {
    const r = await request.post(`${RENDERER}/api/r/unlock`, { headers: { origin: RENDERER, "content-type": "application/json" }, data: { slug, passcode: String(1000 + i) } });
    statuses.push(r.status());
  }
  expect(statuses.slice(0, 6).every((s) => s === 403)).toBe(true);
  expect(statuses.slice(6)).toEqual([429, 429]);
  // Even the right code is refused while locked out.
  const r = await request.post(`${RENDERER}/api/r/unlock`, { headers: { origin: RENDERER, "content-type": "application/json" }, data: { slug, passcode: "8642" } });
  expect(r.status()).toBe(429);
  await api(page).put(`/api/sites/${siteId}/passcode`, { passcode: null });
});

test("sign-in never redirects off-site", async () => {
  for (const next of ["//evil.example/x", "https://evil.example", "/\\evil.example"]) {
    await page.goto(`${APP}/login?next=${encodeURIComponent(next)}`);
    expect(new URL(page.url()).origin).toBe(APP);
  }
});

test("abuse reports from the page reach the admin queue", async ({ browser }) => {
  const r = await recipient(browser);
  await r.page.goto(url);
  await r.page.getByRole("button", { name: "report" }).click();
  await r.page.getByLabel("Copyright (e.g. music)").check();
  await r.page.getByRole("button", { name: "Send report" }).click();
  await expect(r.page.getByText("Thank you. We'll review this page.")).toBeVisible();
  const { data } = await admin().from("abuse_reports").select("reason, reporter_hash, status").eq("site_id", siteId);
  expect(data).toEqual([expect.objectContaining({ reason: "copyright", status: "open" })]);
  expect(data![0]!.reporter_hash).toMatch(/^[0-9a-f]{32}$/);
  await r.context.close();
});
