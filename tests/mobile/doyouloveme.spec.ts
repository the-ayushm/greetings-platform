import { expect, test } from "@playwright/test";
import { DEMO_CONTENT } from "@/templates/doyouloveme/defaults";
import { APP } from "../e2e/helpers";

/**
 * "Do You Love Me?" on phone emulation: iPhone 13 (WebKit — Safari's engine) and Pixel 7
 * (Chromium — Android Chrome / WhatsApp & Instagram in-app WebViews). Taps No through the
 * whole sequence, then the full-screen YES and the celebration.
 */
test.describe.configure({ timeout: 180_000 });

test("tap No until YES fills the screen, then YES", async ({ page }) => {
  // Same reasoning as recipient.spec.ts: taps skip WebKit's rAF-based "stable" wait; every tap
  // is followed by an assertion of its effect.
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${APP}/demo/do-you-love-me`);
  await page.waitForSelector(".dy[data-hydrated]");
  const no = page.getByTestId("dy-no");
  for (const msg of DEMO_CONTENT.question.noMessages) {
    await no.tap({ force: true });
    await expect(no).toHaveText(msg);
  }
  const vw = await page.evaluate(() => window.innerWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect((await page.getByTestId("dy-yes").boundingBox())!.width).toBeLessThanOrEqual(vw);
  await no.tap({ force: true });
  const take = page.getByTestId("dy-takeover");
  await expect(take).toHaveAttribute("data-full", "");
  await page.waitForTimeout(1200);
  const box = (await take.boundingBox())!;
  expect(box.width).toBe(vw);
  await take.tap({ force: true });
  await expect(page.getByRole("heading", { name: DEMO_CONTENT.finale.heading })).toBeVisible();
  expect(errors).toEqual([]);
});
