import { expect, test, type Page } from "@playwright/test";
import { priceLabel } from "@/lib/store";
import { admin } from "../helpers/db";
import { APP, newCustomer } from "./helpers";

/**
 * Digital Gifting storefront: brand, homepage sections, Explore (search / category / sort),
 * category and pricing pages, trending + original-price data from Admin, mobile navigation and
 * no sideways scrolling. Everything shown must come from the database (no invented products).
 */
test.describe.configure({ mode: "serial", timeout: 120_000 });

async function onSale() {
  const [{ data: t }, { data: p }] = await Promise.all([
    admin().from("templates").select("key").eq("is_active", true),
    admin().from("products").select("template_key, name, price_paise").eq("is_active", true),
  ]);
  const live = new Set((t ?? []).map((x) => x.key));
  return (p ?? []).filter((x) => live.has(x.template_key));
}

async function noSideways(page: Page, where: string) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, `${where} scrolls sideways`).toBeLessThanOrEqual(0);
}

test.afterAll(async () => {
  await admin().from("products").update({ is_featured: false, compare_at_paise: null }).eq("template_key", "lovestory");
});

test("homepage: Digital Gifting brand, real products only, every section", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(APP);
  await expect(page).toHaveTitle(/Digital Gifting/);
  const header = page.locator("header");
  await expect(header.getByRole("link", { name: "Digital Gifting — home" })).toBeVisible();
  await expect(header).not.toContainText("Birthday Surprise");
  for (const name of ["Home", "Explore Products", "How It Works", "Pricing"]) await expect(header.getByRole("link", { name, exact: true })).toBeVisible();
  // Product links are no longer in the navbar.
  for (const name of ["Love Story ♡", "Weddings", "Do You Love Me?"]) await expect(header.getByRole("link", { name })).toHaveCount(0);

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Make every moment unforgettable");
  const sale = await onSale();
  await expect(page.locator("section:has(#collection) [data-testid=product-card]")).toHaveCount(Math.min(sale.length, 6));
  for (const p of sale.slice(0, 6)) await expect(page.locator(`section:has(#collection) [data-product="${p.template_key}"]`)).toContainText(priceLabel(p.price_paise));
  await expect(page.getByRole("heading", { name: "Find the perfect digital gift" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Don't just imagine it. Experience it." })).toBeVisible();
  await expect(page.locator("#how-it-works")).toBeVisible();
  // No trending products flagged → no trending section; no reviews → no testimonials.
  await expect(page.getByRole("heading", { name: "Trending experiences ♡" })).toHaveCount(0);
  await expect(page.locator("#reviews")).toHaveCount(0);
  await expect(page.locator("footer")).toContainText("Digital Gifting");
  for (const name of ["Terms & Conditions", "Privacy Policy", "Refund Policy", "Delivery Policy", "Contact us"]) await expect(page.locator("footer").getByRole("link", { name })).toBeVisible();
  expect(errors).toEqual([]);
});

test("live demos open the real demo routes", async ({ page }) => {
  await page.goto(APP);
  const tabs = page.getByRole("tablist", { name: "Choose a demo" }).getByRole("tab");
  const n = await tabs.count();
  expect(n).toBe((await onSale()).length);
  await tabs.nth(n - 1).click();
  await expect(tabs.nth(n - 1)).toHaveAttribute("aria-selected", "true");
  const panel = page.locator("section:has(#demos)");
  const full = panel.getByRole("link", { name: "Open full demo ↗" });
  const href = await full.getAttribute("href");
  expect(href).toMatch(/^\/demo/);
  expect((await page.request.get(`${APP}${href}`)).status()).toBe(200);
  // Tapping the phone swaps in the live demo iframe.
  await panel.locator("button[aria-label*='demo']").first().click();
  await expect(panel.locator("iframe")).toHaveAttribute("src", new RegExp(`^${href!.replace(/[?]/g, "\\?")}`));
});

test("explore: search, category filter and sorting", async ({ page }) => {
  const sale = await onSale();
  await page.goto(`${APP}/products`);
  await expect(page.getByRole("heading", { level: 1, name: "All digital gifts" })).toBeVisible();
  await expect(page.getByTestId("product-card")).toHaveCount(sale.length);
  // Sort by price, low to high (submits on change).
  await page.getByLabel("Sort by").selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  const prices = await page.getByTestId("product-price").allTextContents();
  expect(prices).toEqual([...sale].sort((a, b) => a.price_paise - b.price_paise).map((p) => priceLabel(p.price_paise)));
  // Search.
  await page.getByLabel("Search gifts").fill("love story");
  await page.getByLabel("Search gifts").press("Enter");
  await expect(page).toHaveURL(/q=love\+story/);
  await expect(page.getByTestId("result-count")).toContainText("for “love story”");
  for (const t of await page.getByTestId("product-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-product")))) expect(t).toBe("lovestory");
  await page.getByLabel("Search gifts").fill("zzz-nothing");
  await page.getByLabel("Search gifts").press("Enter");
  await expect(page.getByText("Nothing matches that yet")).toBeVisible();
  // Old-style ?category= goes to the category page.
  await page.goto(`${APP}/products?category=love-stories`);
  await expect(page).toHaveURL(`${APP}/categories/love-stories`);
});

test("category pages list only their products; unknown ones are 404", async ({ page }) => {
  await page.goto(`${APP}/categories/love-stories`);
  await expect(page.getByRole("heading", { level: 1, name: "Love Stories" })).toBeVisible();
  for (const t of await page.getByTestId("product-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-product")))) expect(t).toBe("lovestory");
  await expect(page.getByRole("navigation", { name: "Categories" }).getByRole("link", { name: "Love Stories", exact: true })).toHaveAttribute("aria-current", "page");
  expect((await page.goto(`${APP}/categories/not-a-category`))?.status()).toBe(404);
});

test("pricing page shows every product on sale at its database price", async ({ page }) => {
  await page.goto(`${APP}/pricing`);
  const sale = await onSale();
  await expect(page.getByTestId("pricing-row")).toHaveCount(sale.length);
  for (const p of sale) await expect(page.locator(`[data-testid=pricing-row][data-product="${p.template_key}"]`)).toContainText(priceLabel(p.price_paise));
});

test("trending and original price come from Admin data, and only when set", async ({ page }) => {
  const { data: love } = await admin().from("products").select("price_paise").eq("template_key", "lovestory").single();
  // A lower "original price" is never shown.
  await admin().from("products").update({ is_featured: true, compare_at_paise: Math.max(100, love!.price_paise - 100) }).eq("template_key", "lovestory");
  await page.goto(APP);
  const trending = page.locator("section:has(#trending)");
  await expect(trending.locator('[data-product="lovestory"]')).toBeVisible();
  await expect(trending.locator('[data-product="lovestory"]')).toContainText("★ Trending");
  await expect(trending.locator('[data-product="lovestory"]')).not.toContainText("% off");
  await admin().from("products").update({ compare_at_paise: love!.price_paise * 2 }).eq("template_key", "lovestory");
  await page.goto(`${APP}/products`);
  const card = page.locator('[data-testid=product-card][data-product="lovestory"]');
  await expect(card).toContainText("50% off");
  await expect(card.locator("s")).toHaveText(priceLabel(love!.price_paise * 2));
  // Featured sorts first.
  await expect(page.getByTestId("product-card").first()).toHaveAttribute("data-product", "lovestory");
});

test("product pages show related products from the catalog", async ({ page }) => {
  await page.goto(`${APP}/product`);
  await expect(page.getByRole("heading", { name: "You may also love" })).toBeVisible();
  await expect(page.locator("section:has(#related) [data-testid=product-card]").first()).toBeVisible();
  expect(await page.locator('section:has(#related) [data-product="scrapbook"]').count()).toBe(0);
});

test("phones: menu works and no page scrolls sideways", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  for (const path of ["/", "/products", "/categories/love-stories", "/pricing", "/product", "/products/love-story", "/login"]) {
    await page.goto(`${APP}${path}`);
    await noSideways(page, path);
  }
  await page.goto(APP);
  const menu = page.getByTestId("menu-button");
  await expect(menu).toBeVisible();
  await expect(page.locator("header nav").first()).toBeHidden();
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.locator("#mobile-menu").getByRole("link", { name: "Explore Products" }).click();
  await expect(page).toHaveURL(`${APP}/products`);
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
  await ctx.close();
});

test("signed-in customers get My Sites and Account in the menu, and an empty My Sites points to the store", async ({ browser }) => {
  const { page, context } = await newCustomer(browser, "store");
  await page.goto(APP);
  await expect(page.locator("header").getByRole("link", { name: "My Sites" })).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: "Account" })).toBeVisible();
  await page.goto(`${APP}/dashboard`);
  await expect(page.getByRole("heading", { level: 1, name: "My Sites" })).toBeVisible();
  await page.getByRole("link", { name: "Explore gifts" }).click();
  await expect(page).toHaveURL(`${APP}/products`);
  await context.close();
});
