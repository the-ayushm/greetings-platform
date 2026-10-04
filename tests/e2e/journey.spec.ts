import sharp from "sharp";
import { expect, test } from "@playwright/test";
import { admin } from "../helpers/db";
import { APP, buySite, email, login, recipient, RENDERER } from "./helpers";

/**
 * The whole real customer journey, through the UI:
 * landing → product → login (emailed code) → checkout → Razorpay test payment → webhook →
 * site created → personalise (names, photo, song) → live preview → publish → recipient opens
 * the unique URL → customer edits & republishes → rotate link → passcode → unpublish → delete.
 */
test.describe.configure({ timeout: 300_000 });

test("complete customer journey", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // Landing → product
  await page.goto(APP);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("private scrapbook website");
  await page.getByRole("link", { name: /Make yours/ }).first().click();
  await expect(page).toHaveURL(/\/product$/);
  await expect(page.getByText("₹499")).toBeVisible();

  // Buying requires an account: checkout redirects to login with a safe "next".
  await page.getByRole("link", { name: "Buy now" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);
  const address = email("journey");
  await login(page, address, new URL(page.url()).searchParams.get("next")!);
  await expect(page).toHaveURL(/\/checkout/);

  // Checkout → payment → webhook → site
  const siteId = await buySite(page);
  const db = admin();
  const { data: site0 } = await db.from("sites").select("status, order_id, edit_until, expires_at").eq("id", siteId).single();
  expect(site0!.status).toBe("draft");
  const days = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  expect(days(site0!.edit_until)).toBe(30);
  expect(days(site0!.expires_at)).toBe(365);
  const { data: events } = await db.from("payment_events").select("event_type, processed_at, summary").eq("razorpay_order_id", (await db.from("orders").select("razorpay_order_id").eq("id", site0!.order_id).single()).data!.razorpay_order_id!);
  expect(events!.some((e) => e.event_type === "order.paid" && e.processed_at)).toBe(true);
  // The webhook inbox never stores the payer's contact details.
  expect(JSON.stringify(events)).not.toMatch(/payer@example\.com|9999999999/);

  // Personalise
  await page.getByLabel("Their name").fill("प्रिया Priya");
  await page.getByLabel("Your name").fill("Arjun");
  await page.locator("#names input[type=file]").first().setInputFiles("tests/fixtures/photo-gps.jpg");
  await expect(page.locator("#names img").first()).toBeVisible({ timeout: 30_000 });
  await page.getByText("6. Our song & reasons").click();
  await page.getByLabel(/I own this recording/).check();
  await page.locator("#song input[type=file][accept*=audio]").setInputFiles("tests/fixtures/song.mp3");
  await expect(page.locator("#song").getByText("♪ song.mp3")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("save-state")).toHaveText("All changes saved", { timeout: 15_000 });

  // Live preview shows the draft
  const preview = page.frameLocator('iframe[title="Live preview of your birthday site"]');
  await expect(preview.locator(".cover-name")).toContainText("प्रिया Priya", { timeout: 15_000 });
  await expect(preview.locator(".preview-ribbon")).toBeVisible();

  // Publish
  await page.getByTestId("publish").click();
  const url = (await page.getByTestId("published-url").textContent())!.trim();
  expect(url).toMatch(new RegExp(`^${RENDERER}/birthday/[A-Za-z0-9]{22}$`));

  // Recipient: no account, different origin
  const r = await recipient(browser);
  const recErrors: string[] = [];
  r.page.on("pageerror", (e) => recErrors.push(e.message));
  const res = await r.page.goto(url);
  expect(res!.headers()["x-robots-tag"]).toContain("noindex");
  expect(res!.headers()["referrer-policy"]).toBe("no-referrer");
  await r.page.waitForSelector("#app[data-hydrated]");
  await expect(r.page.locator(".cover-name")).toContainText("प्रिया Priya");
  await expect(r.page.locator(".addr")).toContainText("www.for-प्रिया-priya.love");
  const img = r.page.locator("#cover .ph img");
  await expect(img).toHaveJSProperty("complete", true);
  const src = (await img.getAttribute("src"))!;
  expect(src).toContain("/storage/v1/object/sign/media/");
  expect(src).not.toContain(siteId);
  const served = Buffer.from(await (await fetch(src)).arrayBuffer());
  const meta = await sharp(served).metadata();
  expect(meta.format).toBe("webp");
  expect(meta.exif).toBeUndefined();
  expect(served.includes(Buffer.from("TestPhone"))).toBe(false);
  // No auth cookies ever reach the renderer origin.
  expect((await r.context.cookies(RENDERER)).filter((c) => c.name.startsWith("sb-"))).toEqual([]);

  // Play the uploaded song
  await r.page.click('#cover [data-go="quiz"]');
  for (let i = 0; i < 3; i++) {
    await r.page.locator("#qBody [data-a]").first().click();
    await r.page.waitForTimeout(1300);
  }
  await r.page.click('#qBody [data-go="menu"]');
  await r.page.waitForTimeout(1100);
  await r.page.click('#menu [data-card="song"]');
  await r.page.waitForTimeout(1100);
  await r.page.click("#playBtn");
  await expect(r.page.locator("#songHint")).toHaveText("this one always makes me think of you ♡", { timeout: 10_000 });
  await r.page.waitForTimeout(3500); // view ping fires after 3 s

  // Customer sees the view, edits, republishes
  await expect.poll(async () => (await db.from("sites").select("view_count").eq("id", siteId).single()).data!.view_count).toBeGreaterThan(0);
  await page.getByText("3. Your letter").click();
  await page.getByLabel("Greeting").fill("Happy birthday, sunshine!");
  await expect(page.getByTestId("save-state")).toHaveText("All changes saved", { timeout: 15_000 });
  // Not live until republished
  const before = await (await fetch(url)).text();
  expect(before).not.toContain("sunshine");
  await page.getByTestId("publish").click();
  await expect(page.getByTestId("published-url")).toHaveText(url);
  await expect.poll(async () => (await fetch(url)).text()).toContain("Happy birthday, sunshine!");

  // Share page: QR + WhatsApp, rotate link
  await page.goto(`${APP}/dashboard/sites/${siteId}`);
  await expect(page.getByTestId("site-url")).toHaveText(url);
  await expect(page.getByAltText("QR code for your birthday site")).toBeVisible();
  await expect(page.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute("href", new RegExp(`^https://wa\\.me/\\?text=.*${encodeURIComponent(url).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Make a new link" }).click();
  await expect(page.getByText("New link created")).toBeVisible();
  const newUrl = (await page.getByTestId("site-url").textContent())!.trim();
  expect(newUrl).not.toBe(url);
  expect((await fetch(url)).status).toBe(404);
  expect((await fetch(newUrl)).status).toBe(200);

  // Passcode
  await page.getByLabel("New passcode").fill("1402");
  await page.getByRole("button", { name: "Set passcode" }).click();
  await expect(page.getByText("Passcode saved.")).toBeVisible();
  const r2 = await recipient(browser);
  await r2.page.goto(newUrl);
  await expect(r2.page.getByRole("heading", { name: "A surprise is waiting" })).toBeVisible();
  expect(await r2.page.content()).not.toContain("Priya");
  await r2.page.getByLabel("Secret code").fill("9999");
  await r2.page.getByRole("button", { name: "OPEN ♡" }).click();
  await expect(r2.page.locator(".gate-err")).toContainText("isn't right");
  await r2.page.getByLabel("Secret code").fill("1402");
  await r2.page.getByRole("button", { name: "OPEN ♡" }).click();
  await expect(r2.page.locator(".cover-name")).toContainText("Priya");

  // Unpublish → link off; delete → everything gone
  await page.reload();
  await page.getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByText(/Unpublished/)).toBeVisible();
  expect((await fetch(newUrl)).status).toBe(404);

  const { data: assets } = await db.from("assets").select("id, storage_prefix").eq("site_id", siteId);
  expect(assets!.length).toBeGreaterThanOrEqual(2);
  await page.getByPlaceholder("Type DELETE").fill("DELETE");
  await page.getByRole("button", { name: "Delete site" }).click();
  await page.waitForURL(`${APP}/dashboard`);
  await expect(page.getByText("nothing here yet")).toBeVisible();
  const { data: gone } = await db.from("sites").select("status, slug, draft_content").eq("id", siteId).single();
  expect(gone).toEqual({ status: "deleted", slug: null, draft_content: {} });
  expect((await db.from("assets").select("id").eq("site_id", siteId)).data).toEqual([]);
  expect((await db.from("site_versions").select("id").eq("site_id", siteId)).data).toEqual([]);
  for (const a of assets!) expect((await db.storage.from("media").list(a.storage_prefix)).data).toEqual([]);
  // The order record is kept for accounting.
  expect((await db.from("orders").select("status").eq("id", site0!.order_id).single()).data!.status).toBe("paid");

  expect(errors, "customer page errors").toEqual([]);
  expect(recErrors, "recipient page errors").toEqual([]);
  await Promise.all([ctx.close(), r.context.close(), r2.context.close()]);
});
