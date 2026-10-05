import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { api, APP, buySite, newCustomer } from "../e2e/helpers";

/** axe-core (WCAG 2.1 A/AA) on every page type, including every scene of the birthday template. Zero violations allowed. */
test.describe.configure({ mode: "serial", timeout: 240_000 });

async function scan(page: Page, label: string) {
  await page.waitForLoadState("networkidle");
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) → ${v.nodes[0]?.target.join(" ")}`), label).toEqual([]);
}

test("store pages", async ({ page }) => {
  for (const p of ["/", "/product", "/login", "/legal/terms", "/legal/privacy", "/legal/refund", "/contact"]) {
    await page.goto(`${APP}${p}`);
    await scan(page, p);
  }
});

test("birthday experience (demo) across scenes", async ({ page }) => {
  await page.goto(`${APP}/demo`);
  await page.waitForSelector("#app[data-hydrated]");
  await scan(page, "cover");
  await page.click('#cover [data-go="quiz"]');
  await page.waitForTimeout(1100);
  await scan(page, "quiz");
  for (let i = 0; i < 3; i++) {
    await page.locator("#qBody [data-a]").first().click();
    await page.waitForTimeout(1300);
  }
  await page.click('#qBody [data-go="menu"]');
  await page.waitForTimeout(1100);
  await scan(page, "menu");
  for (const card of ["letter", "memories", "coupons", "song"]) {
    await page.click(`#menu [data-card="${card}"]`);
    await page.waitForTimeout(1100);
    await scan(page, card);
    await page.click(`#${card} [data-go="menu"]`);
    await page.waitForTimeout(1100);
  }
});

test("keyboard: scene changes move focus, the lightbox traps and returns focus, Escape closes", async ({ page }) => {
  await page.goto(`${APP}/demo`);
  await page.waitForSelector("#app[data-hydrated]");
  await page.focus('#cover [data-go="quiz"]');
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1100);
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("quiz");
  await expect(page.locator("p.sr-only[aria-live]")).toHaveText("Questions");
  await page.goto(`${APP}/demo`);
  await page.waitForSelector("#app[data-hydrated]");
  await page.evaluate(() => {
    (document.querySelector('[data-go="quiz"]') as HTMLElement).click();
  });
  await page.waitForTimeout(1100);
  for (let i = 0; i < 3; i++) {
    await page.locator("#qBody [data-a]").first().click();
    await page.waitForTimeout(1300);
  }
  await page.click('#qBody [data-go="menu"]');
  await page.waitForTimeout(1100);
  await page.click('#menu [data-card="memories"]');
  await page.waitForTimeout(1100);
  await page.focus('#memories [data-m="1"]');
  await page.keyboard.press("Enter");
  await expect(page.locator("#lift.on")).toBeVisible();
  expect(await page.evaluate(() => (document.activeElement as HTMLElement)?.hasAttribute("data-close"))).toBe(true);
  for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.getElementById("lift")!.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#lift.on")).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.getAttribute("data-m"))).toBe("1");
});

test("customer dashboard, editor, share and account pages", async ({ browser }) => {
  const c = await newCustomer(browser, "a11y");
  const siteId = await buySite(c.page);
  await scan(c.page, "editor");
  await c.page.goto(`${APP}/dashboard`);
  await scan(c.page, "dashboard");
  await c.page.goto(`${APP}/dashboard/sites/${siteId}`);
  await scan(c.page, "share");
  await c.page.goto(`${APP}/dashboard/account`);
  await scan(c.page, "account");
  // Recipient-side gate and not-found
  const { data } = await (await import("../helpers/db")).admin().from("sites").select("draft_content, draft_revision").eq("id", siteId).single();
  await api(c.page).put(`/api/sites/${siteId}/draft`, { content: { ...(data!.draft_content as object), recipientName: "R", senderName: "S" }, revision: data!.draft_revision });
  const url = ((await api(c.page).post(`/api/sites/${siteId}/publish`)).json as { url: string }).url;
  await api(c.page).put(`/api/sites/${siteId}/passcode`, { passcode: "2468" });
  const rc = await browser.newContext();
  const r = await rc.newPage();
  await r.goto(url);
  await scan(r, "passcode gate");
  await r.goto(`${url.slice(0, -3)}zzz`);
  await scan(r, "not found");
  await rc.close();
  await c.context.close();
});
