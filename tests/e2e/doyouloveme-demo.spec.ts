import { expect, test, type Page } from "@playwright/test";
import { DEMO_CONTENT } from "@/templates/doyouloveme/defaults";
import { APP } from "./helpers";

/**
 * The public "Do You Love Me?" demo at every width from the brief: nothing overflows, YES and
 * NO never overlap, NO stays clickable through the whole sequence, YES fills the screen and the
 * celebration fits. Plus reduced motion, keyboard use and the sound toggle.
 */

// Each size presses No through every line with pauses for the animations (plus screenshots).
test.describe.configure({ timeout: 180_000 });

const VIEWPORTS: [number, number][] = [
  [320, 568],
  [375, 667],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1440, 900],
];
const MESSAGES = DEMO_CONTENT.question.noMessages;
type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

async function open(page: Page, query = "") {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${APP}/demo/do-you-love-me${query}`);
  await page.waitForSelector(".dy[data-hydrated]");
  await page.waitForTimeout(1100); // entrance animation
  return errors;
}

/** Nothing sticks out sideways, inside the page or the card. */
async function noSideways(page: Page) {
  const r = await page.evaluate(() => {
    const dy = document.querySelector(".dy")!;
    const card = document.querySelector(".dy-card")?.getBoundingClientRect();
    return { doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, dy: dy.scrollWidth - dy.clientWidth, cardRight: card ? card.right : 0, vw: window.innerWidth };
  });
  expect(r.doc).toBeLessThanOrEqual(0);
  expect(r.dy).toBeLessThanOrEqual(0);
  expect(r.cardRight).toBeLessThanOrEqual(r.vw);
}

for (const [w, h] of VIEWPORTS) {
  test(`${w}×${h}: the whole sequence works and fits`, async ({ page }, info) => {
    await page.setViewportSize({ width: w, height: h });
    const errors = await open(page);
    const yes = page.getByTestId("dy-yes");
    const no = page.getByTestId("dy-no");
    await noSideways(page);
    // Touch targets.
    expect((await yes.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await no.boundingBox())!.height).toBeGreaterThanOrEqual(36);
    await page.screenshot({ path: info.outputPath(`ask-${w}-0.png`) });

    const fontPx = async () => parseFloat(await yes.evaluate((e) => getComputedStyle(e).fontSize));
    let lastFont = await fontPx();
    for (const [i, msg] of MESSAGES.entries()) {
      await no.click();
      await expect(no).toHaveText(msg);
      await page.waitForTimeout(650);
      const f = await fontPx();
      expect(f, `YES text grows after press ${i + 1}`).toBeGreaterThan(lastFont);
      lastFont = f;
      const y = (await yes.boundingBox())!;
      const n = (await no.boundingBox())!;
      expect(overlaps(y, n), `press ${i + 1}`).toBe(false);
      // The No button is still the topmost thing at its own centre.
      const hit = await page.evaluate(([x, yy]) => document.elementFromPoint(x!, yy!)?.closest("[data-testid]")?.getAttribute("data-testid"), [n.x + n.width / 2, n.y + n.height / 2] as const).catch(() => null);
      if (n.y + n.height <= h && n.y >= 0) expect(hit, `NO is not covered (press ${i + 1})`).toBe("dy-no");
      await noSideways(page);
    }
    await page.screenshot({ path: info.outputPath(`ask-${w}-max.png`) });

    await no.click();
    const take = page.getByTestId("dy-takeover");
    await expect(take).toHaveAttribute("data-full", "");
    await page.waitForTimeout(1100);
    expect(await take.boundingBox()).toMatchObject({ x: 0, y: 0, width: w, height: h });
    await page.screenshot({ path: info.outputPath(`ask-${w}-takeover.png`) });

    await take.click();
    await expect(page.getByRole("heading", { name: DEMO_CONTENT.finale.heading })).toBeVisible();
    await page.waitForTimeout(1600);
    const fin = await page.evaluate(() => {
      const f = document.querySelector('[data-testid="dy-finale"]')!;
      return f.scrollWidth - f.clientWidth;
    });
    expect(fin).toBeLessThanOrEqual(0);
    await page.screenshot({ path: info.outputPath(`ask-${w}-finale.png`) });
    expect(errors).toEqual([]);
  });
}

test("reduced motion: no animation, but every screen still works", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = await open(page);
  await expect(page.locator(".dy")).toHaveAttribute("data-still", "");
  expect(await page.locator(".dy-drift").count()).toBe(0);
  for (let i = 0; i <= MESSAGES.length; i++) await page.getByTestId("dy-no").click();
  await expect(page.getByTestId("dy-takeover")).toHaveAttribute("data-full", "");
  expect(await page.getByTestId("dy-takeover").boundingBox()).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
  await page.getByTestId("dy-takeover").click();
  await expect(page.getByRole("heading", { name: DEMO_CONTENT.finale.heading })).toBeVisible();
  expect(await page.locator(".dy-confetti").count()).toBe(0);
  expect(errors).toEqual([]);
  await ctx.close();
});

test("keyboard: Tab to the buttons, Enter answers, focus follows the screen", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await open(page);
  await page.getByTestId("dy-no").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("dy-no")).toHaveText(MESSAGES[0]!);
  await expect(page.locator(".dy-sr[aria-live]")).toHaveText(MESSAGES[0]!);
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByTestId("dy-yes")).toBeFocused();
  await page.keyboard.press("Enter");
  const heading = page.getByRole("heading", { name: DEMO_CONTENT.finale.heading });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused({ timeout: 3000 });
  // The question underneath is out of reach while the celebration shows.
  await expect(page.locator("main.dy-stage")).toHaveAttribute("inert", "");
  await page.getByTestId("dy-replay").press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("sound is off until the visitor turns it on, and toggles cleanly", async ({ page }) => {
  const errors = await open(page);
  const s = page.getByTestId("dy-sound");
  await expect(s).toHaveAttribute("aria-pressed", "false");
  await s.click();
  await expect(s).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("dy-no").click();
  await s.click();
  await expect(s).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
});

test("demo deep links open the takeover and the celebration", async ({ page }) => {
  await open(page, "?at=takeover");
  await expect(page.getByTestId("dy-takeover")).toHaveAttribute("data-full", "");
  await open(page, "?at=finale");
  await expect(page.getByTestId("dy-finale")).toBeVisible();
  await expect(page.getByRole("heading", { name: DEMO_CONTENT.finale.heading })).toBeVisible();
});
