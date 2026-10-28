import { expect, test, type Page } from "@playwright/test";
import { DEMO_CONTENT } from "@/templates/wedding/defaults";
import { mapsUrl } from "@/templates/wedding/time";
import { admin, totp } from "../helpers/db";
import { api, APP, newCustomer, recipient, RENDERER } from "./helpers";

/**
 * "Royal Burgundy" wedding invitation: hidden while it's not on sale, an MFA'd admin gets it
 * free (no payment provider involved), customises via the draft API, publishes to
 * /wedding/<slug>; a guest opens the envelope and RSVPs; the owner sees (only) their replies.
 */
test.describe.configure({ mode: "serial", timeout: 180_000 });

let customer: Page;
let other: Page;
let adminPage: Page;
let productId: string;
let siteId: string;
let url: string;

async function product() {
  const { data } = await admin().from("products").select("id, price_paise, is_active").eq("template_key", "wedding").single();
  return data!;
}

/** The demo invitation, for a wedding ~60 days away. */
function invitation() {
  const c = structuredClone(DEMO_CONTENT);
  c.event.date = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
  c.couple.brideName = "<img src=x onerror=window.__pwned=1>";
  c.couple.groomName = "Kabir";
  c.rsvp.maxGuests = 3;
  return c;
}

test.beforeAll(async ({ browser }) => {
  // Three sign-ins plus MFA enrolment.
  test.setTimeout(300_000);
  // Start from the shipped state: not on sale, ₹0.
  await admin().from("products").update({ is_active: false, price_paise: 0 }).eq("template_key", "wedding");
  productId = (await product()).id;
  ({ page: customer } = await newCustomer(browser, "wed"));
  ({ page: other } = await newCustomer(browser, "wed-b"));
  const a = await newCustomer(browser, "wed-adm");
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
  // Leave the product exactly as shipped, whatever happened above.
  await admin().from("products").update({ is_active: false, price_paise: 0 }).eq("template_key", "wedding");
});

test("while it isn't on sale, customers can't see or get it", async () => {
  expect((await customer.goto(`${APP}/products/wedding-invitation`))?.status()).toBe(404);
  await customer.goto(`${APP}/`);
  await expect(customer.getByRole("link", { name: "Weddings" })).toHaveCount(0);
  await expect(customer.getByRole("heading", { name: /Royal Burgundy/ })).toHaveCount(0);
  expect((await api(customer).post("/api/checkout", { productId })).status).toBe(404);
  // Existing products are untouched.
  await customer.goto(`${APP}/product`);
  await expect(customer.getByText("₹499").first()).toBeVisible();
  expect((await customer.goto(`${APP}/products/love-story`))?.status()).toBe(200);
});

test("an MFA'd admin can preview the product page; the price comes from the database", async () => {
  await adminPage.goto(`${APP}/products/wedding-invitation`);
  await expect(adminPage.getByText("Testing mode — only admins can see this page.")).toBeVisible();
  await expect(adminPage.getByRole("heading", { level: 1 })).toHaveText("Royal Burgundy — Interactive Wedding Invitation Website");
  await expect(adminPage.getByTestId("wedding-price")).toHaveText("Free");
  await expect(adminPage.getByTestId("wedding-demo")).toHaveAttribute("href", "/demo/wedding");
  // Price edited through the admin API shows on the page; the browser never sends a price.
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { pricePaise: 12_900 })).status).toBe(200);
  await adminPage.reload();
  await expect(adminPage.getByTestId("wedding-price")).toHaveText("₹129");
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { pricePaise: 50 })).status).toBe(400);
  expect((await api(customer).raw("PATCH", `/api/admin/products/${productId}`, { pricePaise: 0 })).status).toBe(403);
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { pricePaise: 0 })).status).toBe(200);
  await adminPage.goto(`${APP}/admin/catalog`);
  await expect(adminPage.getByText(/Royal Burgundy — Interactive Wedding Invitation Website · Free \(₹0\) · not on sale/)).toBeVisible();
});

test("the admin gets it free — no payment provider, a real order and a draft site", async () => {
  await adminPage.goto(`${APP}/products/wedding-invitation`);
  await adminPage.getByTestId("wedding-buy").click();
  await expect(adminPage.getByText("Testing mode:")).toBeVisible();
  await adminPage.getByTestId("pay").click();
  await adminPage.waitForURL(/\/dashboard\/orders\//);
  await expect(adminPage.getByRole("heading", { name: "You're all set" })).toBeVisible({ timeout: 30_000 });
  await adminPage.getByTestId("start-editing").click();
  await adminPage.waitForURL(/\/dashboard\/sites\/[0-9a-f-]+\/edit/);
  await expect(adminPage.getByText("Wedding invitation studio")).toBeVisible();
  siteId = adminPage.url().match(/sites\/([0-9a-f-]{36})/)![1]!;
  const { data: site } = await admin().from("sites").select("template_key, status, order_id").eq("id", siteId).single();
  expect(site).toMatchObject({ template_key: "wedding", status: "draft" });
  const { data: order } = await admin().from("orders").select("amount_paise, status, razorpay_order_id").eq("id", site!.order_id).single();
  expect(order).toEqual({ amount_paise: 0, status: "paid", razorpay_order_id: null });
  const { count } = await admin().from("payments").select("id", { count: "exact", head: true }).eq("order_id", site!.order_id);
  expect(count).toBe(0);
});

test("publishing needs the essentials, then gives a /wedding/ link", async () => {
  expect((await api(adminPage).post(`/api/sites/${siteId}/publish`)).status).toBe(400);
  const { data } = await admin().from("sites").select("draft_revision").eq("id", siteId).single();
  expect((await api(adminPage).put(`/api/sites/${siteId}/draft`, { content: invitation(), revision: data!.draft_revision })).status).toBe(200);
  const pub = await api(adminPage).post(`/api/sites/${siteId}/publish`);
  expect(pub.status).toBe(200);
  url = (pub.json as { url: string }).url;
  expect(url).toMatch(new RegExp(`^${RENDERER}/wedding/[A-Za-z0-9]{22}$`));
});

test("a guest opens the envelope; text stays text; countdown, map and schedule work", async ({ browser }) => {
  const g = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await g.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForSelector(".wd[data-hydrated]");
  await expect(page.locator(".wd-env")).toBeVisible();
  await page.getByTestId("wd-seal").click({ force: true });
  await expect(page.locator(".wd-env")).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator(".wd-names")).toContainText("<img src=x onerror=window.__pwned=1>");
  await expect(page.locator(".wd-names")).toContainText("Kabir");
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  // Live countdown: ~60 days, ticking.
  await page.locator("#wd-countdown").scrollIntoViewIfNeeded();
  const days = Number(await page.getByTestId("wd-count-days").textContent());
  expect(days).toBeGreaterThanOrEqual(59);
  expect(days).toBeLessThanOrEqual(60);
  const s1 = await page.getByTestId("wd-count-seconds").textContent();
  await expect.poll(() => page.getByTestId("wd-count-seconds").textContent(), { timeout: 3000 }).not.toBe(s1);
  await expect(page.locator(".wd-tl-row")).toHaveCount(DEMO_CONTENT.schedule.items.length);
  await expect(page.getByTestId("wd-maps")).toHaveAttribute("href", mapsUrl(DEMO_CONTENT.location.mapQuery));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  // A returning guest isn't made to sit through the envelope again.
  await page.reload();
  await page.waitForSelector(".wd[data-hydrated]");
  await expect(page.locator(".wd-env")).toHaveCount(0, { timeout: 3000 });
  expect(errors).toEqual([]);
  await g.close();
});

test("RSVP: validation, a real stored reply, no duplicates, no spam", async ({ browser, request }) => {
  const r = await recipient(browser);
  await r.page.goto(url);
  await r.page.waitForSelector(".wd[data-hydrated]");
  await r.page.getByTestId("wd-seal").click({ force: true });
  await r.page.getByTestId("wd-rsvp-open").click();
  const dialog = r.page.getByRole("dialog");
  await dialog.getByTestId("wd-rsvp-submit").click();
  await expect(dialog.getByText("Please enter your name")).toBeVisible();
  await expect(dialog.getByText("Please choose one")).toBeVisible();
  await dialog.getByLabel("Your name").fill("Priya Sharma");
  await dialog.getByLabel(DEMO_CONTENT.rsvp.acceptLabel).check();
  await expect(dialog.getByLabel(/Number of guests/).locator("option")).toHaveCount(3);
  await dialog.getByLabel(/Number of guests/).selectOption("2");
  await dialog.getByLabel(/A message for the couple/).fill("Can't wait!");
  await dialog.getByTestId("wd-rsvp-submit").click();
  await expect(dialog.getByTestId("wd-rsvp-done")).toContainText("Thank you, Priya Sharma!");
  const { data: rows } = await admin().from("site_rsvps").select("guest_name, attending, guests, message").eq("site_id", siteId);
  expect(rows).toEqual([{ guest_name: "Priya Sharma", attending: true, guests: 2, message: "Can't wait!" }]);
  await r.context.close();

  const slug = url.split("/").pop()!;
  const send = (reply: object, website = "") => request.post(`${RENDERER}/api/r/rsvp`, { headers: { origin: RENDERER, "content-type": "application/json" }, data: { slug, reply: { name: "Rahul", attending: true, guests: 1, message: "", ...reply }, website } });
  expect((await send({ name: "  priya   SHARMA " })).status()).toBe(409);
  expect((await send({ guests: 4 })).status()).toBe(400); // over the couple's limit of 3
  expect((await send({ guests: 0 })).status()).toBe(400);
  expect((await send({ name: "" })).status()).toBe(400);
  expect((await send({}, "http://spam.example")).status()).toBe(400);
  expect((await request.post(`${RENDERER}/api/r/rsvp`, { headers: { origin: APP, "content-type": "application/json" }, data: { slug, reply: { name: "X Y", attending: false, guests: 0, message: "" }, website: "" } })).status()).toBe(403);
  const ok = await send({ name: "Anita Rao", attending: false, guests: 0, message: "So sorry" });
  expect(ok.status()).toBe(200);
  const { count } = await admin().from("site_rsvps").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  expect(count).toBe(2);
});

test("only the owner sees and manages replies", async () => {
  await adminPage.goto(`${APP}/dashboard/sites/${siteId}`);
  await expect(adminPage.getByTestId("rsvps")).toContainText("Priya Sharma");
  await expect(adminPage.getByTestId("rsvp-totals")).toContainText("Attending1");
  await expect(adminPage.getByTestId("rsvp-totals")).toContainText("Guests coming2");
  expect((await api(other).del(`/api/sites/${siteId}/rsvps`, { id: null })).status).toBe(404);
  expect((await other.goto(`${APP}/dashboard/sites/${siteId}`))?.status()).toBe(404);
  expect((await other.goto(`${APP}/preview/wedding/${siteId}`))?.status()).toBe(404);
  const { data: one } = await admin().from("site_rsvps").select("id").eq("site_id", siteId).eq("guest_name", "Anita Rao").single();
  expect((await api(adminPage).del(`/api/sites/${siteId}/rsvps`, { id: one!.id })).status).toBe(200);
  const { count } = await admin().from("site_rsvps").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  expect(count).toBe(1);
});

test("each origin serves only its own surface; link previews are generic", async ({ request }) => {
  const slug = url.split("/").pop()!;
  expect((await request.get(`${APP}/wedding/${slug}`)).status()).toBe(404);
  expect((await request.get(`${RENDERER}/love/${slug}`)).status()).toBe(404);
  expect((await request.get(`${RENDERER}/products/wedding-invitation`)).status()).toBe(404);
  expect((await request.get(`${RENDERER}/og/wedding.png`)).status()).toBe(200);
  // Link previews (the <head>: title, description, og:*) never carry names.
  const head = (await (await request.get(url)).text()).split("</head>")[0]!;
  expect(head).toContain("og/wedding.png");
  expect(head).not.toContain("Kabir");
});

test("once on sale it's listed for customers; turning it off hides it again", async () => {
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { isActive: true })).status).toBe(200);
  await customer.goto(`${APP}/`);
  await expect(customer.getByRole("link", { name: "Weddings" })).toBeVisible();
  await expect(customer.getByRole("heading", { name: /Royal Burgundy/ })).toBeVisible();
  await customer.goto(`${APP}/products/wedding-invitation`);
  await expect(customer.getByText("Testing mode")).toHaveCount(0);
  await expect(customer.getByTestId("wedding-price")).toHaveText("Free");
  expect((await api(adminPage).raw("PATCH", `/api/admin/products/${productId}`, { isActive: false })).status).toBe(200);
  expect((await customer.goto(`${APP}/products/wedding-invitation`))?.status()).toBe(404);
});

test("unpublish turns the link off; deleting removes the replies too", async ({ request }) => {
  expect((await api(adminPage).post(`/api/sites/${siteId}/unpublish`)).status).toBe(200);
  expect((await request.get(url)).status()).toBe(404);
  expect((await api(adminPage).del(`/api/sites/${siteId}`, { confirm: "DELETE" })).status).toBe(200);
  const { count } = await admin().from("site_rsvps").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  expect(count).toBe(0);
});
