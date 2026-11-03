import { expect, test, type Page } from "@playwright/test";
import { DEMO_CONTENT } from "@/templates/doyouloveme/defaults";
import type { AskContent } from "@/templates/doyouloveme/schema";
import { admin, totp } from "../helpers/db";
import { api, APP, newCustomer, RENDERER } from "./helpers";

/**
 * "Do You Love Me?": hidden while it's not on sale, an MFA'd admin gets it free (no payment
 * provider), customises it via the draft API, publishes to /ask/<slug>; the partner presses No
 * through every message until YES fills the screen, presses YES, sees the celebration; the
 * owner (only) sees "they said yes after N tries".
 */
test.describe.configure({ mode: "serial", timeout: 180_000 });

let customer: Page;
let other: Page;
let adminPage: Page;
let productId: string;
let siteId: string;
let url: string;

const MESSAGES = ["Are you sure?", "Really sure?", "Think again!", "Last chance!", "Don't break my heart!"];

async function product() {
  const { data } = await admin().from("products").select("id, price_paise, is_active").eq("template_key", "doyouloveme").single();
  return data!;
}

function page(): AskContent {
  const c = structuredClone(DEMO_CONTENT);
  c.people.partnerName = "<img src=x onerror=window.__pwned=1>";
  c.people.senderName = "Kabir";
  c.question.noMessages = [...MESSAGES];
  c.finale.message = "You are my favourite person.";
  return c;
}

const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

test.beforeAll(async ({ browser }) => {
  test.setTimeout(300_000);
  // Start from the shipped state: not on sale, ₹0.
  await admin().from("products").update({ is_active: false, price_paise: 0 }).eq("template_key", "doyouloveme");
  productId = (await product()).id;
  ({ page: customer } = await newCustomer(browser, "ask"));
  ({ page: other } = await newCustomer(browser, "ask-b"));
  const a = await newCustomer(browser, "ask-adm");
  adminPage = a.page;
  await admin().from("profiles").update({ role: "admin" }).eq("email", a.email);
  await adminPage.goto(`${APP}/admin`);
  await expect(adminPage).toHaveURL(`${APP}/admin/mfa`);
  const secret = (await adminPage.getByTestId("totp-secret").textContent())!.trim();
  await adminPage.locator('input[name="totp"]').fill(totp(secret));
  await adminPage.getByRole("button", { name: "Verify" }).click();
  await expect(adminPage).toHaveURL(`${APP}/admin`);
});

test.afterAll(async () => {
  await admin().from("products").update({ is_active: false, price_paise: 0 }).eq("template_key", "doyouloveme");
});

test("while it isn't on sale, customers can't see or get it — and existing products are untouched", async () => {
  expect((await customer.goto(`${APP}/products/do-you-love-me`))?.status()).toBe(404);
  await customer.goto(`${APP}/products`);
  await expect(customer.locator('[data-product="doyouloveme"]')).toHaveCount(0);
  expect((await api(customer).post("/api/checkout", { productId })).status).toBe(404);
  expect((await customer.goto(`${APP}/product`))?.status()).toBe(200);
  expect((await customer.goto(`${APP}/products/love-story`))?.status()).toBe(200);
  // The public demo is always available (that's what the store links to).
  expect((await customer.goto(`${APP}/demo/do-you-love-me`))?.status()).toBe(200);
});

test("an MFA'd admin can preview the product page; the price comes from the database", async () => {
  await adminPage.goto(`${APP}/products/do-you-love-me`);
  await expect(adminPage.getByText("Testing mode — only admins can see this page.")).toBeVisible();
  await expect(adminPage.getByRole("heading", { level: 1 })).toHaveText("Do You Love Me? ❤️");
  await expect(adminPage.getByTestId("ask-price")).toHaveText("Free");
  await expect(adminPage.getByTestId("ask-demo")).toHaveAttribute("href", "/demo/do-you-love-me");
  // Not on sale → no structured data and noindex.
  expect(await adminPage.locator('script[type="application/ld+json"]').count()).toBe(0);
  await expect(adminPage.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { pricePaise: 14_900 })).status).toBe(200);
  await adminPage.reload();
  await expect(adminPage.getByTestId("ask-price")).toHaveText("₹149");
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { pricePaise: 0 })).status).toBe(200);
  // Storefront merchandising fields: admins only, validated, clearable.
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { isFeatured: true, compareAtPaise: 29_900 })).status).toBe(200);
  expect((await admin().from("products").select("is_featured, compare_at_paise").eq("id", productId).single()).data).toEqual({ is_featured: true, compare_at_paise: 29_900 });
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { compareAtPaise: 50 })).status).toBe(400);
  expect((await api(customer).raw("PATCH", `/api/admin/products/${productId}`, { isFeatured: false })).status).toBe(403);
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { isFeatured: false, compareAtPaise: null })).status).toBe(200);
  await adminPage.goto(`${APP}/admin/catalog`);
  await expect(adminPage.getByText(/Do You Love Me\? ❤️ · Free \(₹0\) · not on sale/)).toBeVisible();
});

test("the admin gets it free — a real order and a draft site, straight into the studio", async () => {
  await adminPage.goto(`${APP}/products/do-you-love-me`);
  await adminPage.getByTestId("ask-buy").click();
  await expect(adminPage.getByText("Testing mode:")).toBeVisible();
  await adminPage.getByTestId("pay").click();
  await adminPage.waitForURL(/\/dashboard\/orders\//);
  await expect(adminPage.getByRole("heading", { name: "You're all set" })).toBeVisible({ timeout: 30_000 });
  await expect(adminPage.getByText(/“Do You Love Me\?” page is ready/)).toBeVisible();
  await adminPage.getByTestId("start-editing").click();
  await adminPage.waitForURL(/\/dashboard\/sites\/[0-9a-f-]+\/edit/);
  await expect(adminPage.getByText("“Do You Love Me?” studio")).toBeVisible();
  siteId = adminPage.url().match(/sites\/([0-9a-f-]{36})/)![1]!;
  const { data: site } = await admin().from("sites").select("template_key, status, order_id, draft_content").eq("id", siteId).single();
  expect(site).toMatchObject({ template_key: "doyouloveme", status: "draft" });
  expect((site!.draft_content as AskContent).question.noMessages.length).toBe(DEMO_CONTENT.question.noMessages.length);
  const { data: order } = await admin().from("orders").select("amount_paise, status, razorpay_order_id").eq("id", site!.order_id).single();
  expect(order).toEqual({ amount_paise: 0, status: "paid", razorpay_order_id: null });
});

test("the studio autosaves and its live preview follows the edits", async () => {
  await adminPage.getByLabel("Their name").fill("Meera");
  const frame = adminPage.frameLocator('iframe[title^="Live preview"]');
  await expect(frame.locator(".dy-greeting")).toHaveText("Hey Meera…", { timeout: 15_000 });
  await expect
    .poll(async () => ((await admin().from("sites").select("draft_content").eq("id", siteId).single()).data!.draft_content as AskContent).people.partnerName, { timeout: 20_000 })
    .toBe("Meera");
  await expect(adminPage.getByTestId("save-state")).toContainText("All changes saved");
});

test("publishing needs both names and 3+ “No” lines, then gives an /ask/ link", async () => {
  const { data } = await admin().from("sites").select("draft_revision").eq("id", siteId).single();
  const bad = page();
  bad.people.senderName = "";
  bad.question.noMessages = ["only one"];
  expect((await api(adminPage).put(`/api/sites/${siteId}/draft`, { content: bad, revision: data!.draft_revision })).status).toBe(200);
  const fail = await api(adminPage).post(`/api/sites/${siteId}/publish`);
  expect(fail.status).toBe(400);
  const paths = ((fail.json as { error: { issues?: { path: string }[] } }).error.issues ?? []).map((i) => i.path);
  expect(paths).toEqual(expect.arrayContaining(["people.senderName", "question.noMessages"]));
  const { data: d2 } = await admin().from("sites").select("draft_revision").eq("id", siteId).single();
  expect((await api(adminPage).put(`/api/sites/${siteId}/draft`, { content: page(), revision: d2!.draft_revision })).status).toBe(200);
  const pub = await api(adminPage).post(`/api/sites/${siteId}/publish`);
  expect(pub.status).toBe(200);
  url = (pub.json as { url: string }).url;
  expect(url).toMatch(new RegExp(`^${RENDERER}/ask/[A-Za-z0-9]{22}$`));
});

test("the partner presses No through every line, YES grows until it fills the screen, then YES", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.goto(url);
  await p.waitForSelector(".dy[data-hydrated]");
  await p.waitForTimeout(1200); // entrance animation
  // Customer text is text.
  await expect(p.locator(".dy-greeting")).toHaveText("Hey <img src=x onerror=window.__pwned=1>…");
  expect(await p.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  await expect(p.getByRole("heading", { level: 1 })).toHaveText("Do you love me?");

  const yes = p.getByTestId("dy-yes");
  const no = p.getByTestId("dy-no");
  await expect(no).toHaveText("No");
  let last = (await yes.boundingBox())!;
  for (const [i, msg] of MESSAGES.entries()) {
    await no.click(); // Playwright refuses to click if anything covers it
    await expect(no).toHaveText(msg);
    await expect(no).toHaveAttribute("data-count", String(i + 1));
    await p.waitForTimeout(750);
    const now = (await yes.boundingBox())!;
    expect(now.width * now.height, `YES grows after press ${i + 1}`).toBeGreaterThan(last.width * last.height);
    expect(overlaps(now, (await no.boundingBox())!), `YES and NO never overlap (press ${i + 1})`).toBe(false);
    last = now;
  }
  expect(await p.evaluate(() => document.querySelector(".dy")!.scrollWidth - document.querySelector(".dy")!.clientWidth)).toBe(0);
  // One more No: YES takes over the whole screen.
  await no.click();
  const take = p.getByTestId("dy-takeover");
  await expect(take).toBeVisible();
  await expect(take).toHaveAttribute("data-full", "");
  await p.waitForTimeout(1100);
  const box = (await take.boundingBox())!;
  expect(box).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
  await expect(take).toBeFocused();
  // YES → the celebration.
  await take.click();
  const finale = p.getByTestId("dy-finale");
  await expect(finale).toBeVisible();
  await expect(p.getByRole("heading", { name: "I knew it! ❤️" })).toBeVisible();
  await expect(finale).toContainText("You just made my heart the happiest!");
  await expect(finale).toContainText("You are my favourite person.");
  await expect(finale).toContainText("Forever yours, Kabir");
  await expect(finale).toContainText("Kabir will know you said yes ♡");
  // The sender is told, with the count capped at the published list.
  await expect.poll(async () => (await admin().from("site_responses").select("kind, item_id, label, value").eq("site_id", siteId)).data, { timeout: 10_000 }).toEqual([
    { kind: "answer", item_id: "answer", label: "Do you love me?", value: `Said YES after pressing “No” ${MESSAGES.length} times ♡` },
  ]);
  // Replay starts over, and doesn't notify twice.
  await p.getByTestId("dy-replay").click();
  await expect(p.getByTestId("dy-finale")).toHaveCount(0);
  await expect(no).toHaveText("No");
  await yes.click();
  await expect(p.getByTestId("dy-finale")).toBeVisible();
  await p.waitForTimeout(800);
  const { count } = await admin().from("site_responses").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  expect(count).toBe(1);
  expect(errors).toEqual([]);
  await ctx.close();
});

test("the answer endpoint only takes what this page can send", async ({ request }) => {
  const slug = url.split("/").pop()!;
  const send = (kind: string, itemId: string, value: string, origin = RENDERER) => request.post(`${RENDERER}/api/r/respond`, { headers: { origin, "content-type": "application/json" }, data: { slug, kind, itemId, value } });
  expect((await send("text", "answer", "hi")).status()).toBe(404); // love-story kinds aren't accepted here
  expect((await send("answer", "qfirsttalk", "1")).status()).toBe(404);
  expect((await send("answer", "answer", "-1")).status()).toBe(404);
  expect((await send("answer", "answer", "lots")).status()).toBe(404);
  expect((await send("answer", "answer", "0", APP)).status()).toBe(403); // only from the renderer page
  const ok = await send("answer", "answer", "999");
  expect(ok.status()).toBe(200);
  const { data } = await admin().from("site_responses").select("value").eq("site_id", siteId).order("created_at", { ascending: false }).limit(1).single();
  expect(data!.value).toBe(`Said YES after pressing “No” ${MESSAGES.length} times ♡`); // capped, never the raw number
});

test("only the owner sees the answer", async () => {
  await adminPage.goto(`${APP}/dashboard/sites/${siteId}`);
  await expect(adminPage.getByRole("heading", { name: "Did they say yes?" })).toBeVisible();
  await expect(adminPage.getByTestId("responses")).toContainText(`Said YES after pressing “No” ${MESSAGES.length} times ♡`);
  expect((await other.goto(`${APP}/dashboard/sites/${siteId}`))?.status()).toBe(404);
  expect((await other.goto(`${APP}/preview/ask/${siteId}`))?.status()).toBe(404);
  expect((await api(other).del(`/api/sites/${siteId}/responses`, { id: null })).status).toBe(404);
});

test("with notifications off, nothing about the partner is stored", async ({ request }) => {
  const { data } = await admin().from("sites").select("draft_revision").eq("id", siteId).single();
  const c = page();
  c.responses.notify = false;
  expect((await api(adminPage).put(`/api/sites/${siteId}/draft`, { content: c, revision: data!.draft_revision })).status).toBe(200);
  expect((await api(adminPage).post(`/api/sites/${siteId}/publish`)).status).toBe(200);
  const before = (await admin().from("site_responses").select("id", { count: "exact", head: true }).eq("site_id", siteId)).count;
  const slug = url.split("/").pop()!;
  const r = await request.post(`${RENDERER}/api/r/respond`, { headers: { origin: RENDERER, "content-type": "application/json" }, data: { slug, kind: "answer", itemId: "answer", value: "2" } });
  expect(await r.json()).toEqual({ stored: false });
  expect((await admin().from("site_responses").select("id", { count: "exact", head: true }).eq("site_id", siteId)).count).toBe(before);
});

test("each origin serves only its own surface; link previews are generic", async ({ request }) => {
  const slug = url.split("/").pop()!;
  expect((await request.get(`${APP}/ask/${slug}`)).status()).toBe(404);
  expect((await request.get(`${RENDERER}/love/${slug}`)).status()).toBe(404);
  expect((await request.get(`${RENDERER}/wedding/${slug}`)).status()).toBe(404);
  expect((await request.get(`${RENDERER}/products/do-you-love-me`)).status()).toBe(404);
  expect((await request.get(`${RENDERER}/og/do-you-love-me.png`)).status()).toBe(200);
  const head = (await (await request.get(url)).text()).split("</head>")[0]!;
  expect(head).toContain("og/do-you-love-me.png");
  expect(head).toContain("noindex");
  expect(head).not.toContain("Kabir");
});

test("once on sale it's listed for customers with structured data; turning it off hides it again", async () => {
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { pricePaise: 9_900, isActive: true })).status).toBe(200);
  await customer.goto(`${APP}/products`);
  await expect(customer.locator('[data-testid="product-card"][data-product="doyouloveme"]')).toBeVisible();
  await customer.goto(`${APP}/categories/love-and-romance`);
  await expect(customer.locator('[data-testid="product-card"][data-product="doyouloveme"]')).toBeVisible();
  await customer.goto(`${APP}/products/do-you-love-me`);
  await expect(customer.getByText("Testing mode")).toHaveCount(0);
  await expect(customer.getByTestId("ask-price")).toHaveText("₹99");
  const ld = JSON.parse((await customer.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld).toMatchObject({ "@type": "Product", name: "Do You Love Me? ❤️", offers: { price: "99.00", priceCurrency: "INR" } });
  await expect(customer.locator('link[rel="canonical"]')).toHaveAttribute("href", `${APP}/products/do-you-love-me`);
  // Priced → the real Razorpay checkout path (not the free claim).
  await customer.getByTestId("ask-buy").click();
  await expect(customer.getByTestId("pay")).toHaveText("Pay ₹99");
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { isActive: false, pricePaise: 0 })).status).toBe(200);
  expect((await customer.goto(`${APP}/products/do-you-love-me`))?.status()).toBe(404);
});

test("unpublish turns the link off; deleting removes the answers too", async ({ request }) => {
  expect((await api(adminPage).post(`/api/sites/${siteId}/unpublish`)).status).toBe(200);
  expect((await request.get(url)).status()).toBe(404);
  expect((await api(adminPage).del(`/api/sites/${siteId}`, { confirm: "DELETE" })).status).toBe(200);
  const { count } = await admin().from("site_responses").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  expect(count).toBe(0);
});
