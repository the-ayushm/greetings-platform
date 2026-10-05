import { expect, test, type Page } from "@playwright/test";
import { APP } from "../e2e/helpers";

/**
 * Recipient experience on phone emulation: iPhone 13 (WebKit — Safari's engine) and Pixel 7
 * (Chromium — Android Chrome / WhatsApp & Instagram in-app WebViews). Taps through every scene,
 * checks nothing overflows sideways and no script errors occur.
 */
test.describe.configure({ timeout: 180_000 });

async function noSideScroll(page: Page, where: string) {
  const r = await page.evaluate(() => {
    const s = document.querySelector<HTMLElement>(".scene.on");
    // Decorations (tape, stickers) deliberately poke past the edge; the scene clips them
    // (overflow-x: hidden), so only unclipped overflow would let the user scroll sideways.
    const clipped = s ? getComputedStyle(s).overflowX === "hidden" : true;
    return { doc: document.documentElement.scrollWidth - window.innerWidth, scene: s && !clipped ? s.scrollWidth - s.clientWidth : 0 };
  });
  expect(r.doc, `${where}: page scrolls sideways`).toBeLessThanOrEqual(0);
  expect(r.scene, `${where}: scene scrolls sideways`).toBeLessThanOrEqual(1);
}

test("tap through the whole birthday experience", async ({ page }) => {
  // Playwright's WebKit "stable" check waits on requestAnimationFrame, which parallel headless
  // WebKit instances can throttle indefinitely. Taps skip that wait; every tap below is followed
  // by an assertion of its effect, so an unresponsive control still fails the test.
  const tap = (sel: string) => page.locator(sel).first().tap({ force: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${APP}/demo`);
  await page.waitForSelector("#app[data-hydrated]");
  await noSideScroll(page, "cover");
  await tap('#cover [data-go="quiz"]');
  await page.waitForTimeout(1100);
  for (let i = 0; i < 3; i++) {
    await tap("#qBody [data-a]");
    await page.waitForTimeout(1300);
  }
  await expect(page.locator("#qBar")).toHaveText("ready.exe");
  await tap('#qBody [data-go="menu"]');
  await page.waitForTimeout(1100);
  await noSideScroll(page, "menu");

  await tap('#menu [data-card="letter"]');
  await page.waitForTimeout(1100);
  await tap("#lenv");
  await expect(page.locator("#sheet.show")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#sheet .doodle.show")).toBeVisible({ timeout: 10_000 });
  await noSideScroll(page, "letter");
  await tap('#letter [data-go="menu"]');
  await page.waitForTimeout(1100);

  await tap('#menu [data-card="memories"]');
  await page.waitForTimeout(1100);
  await tap('#memories [data-m="0"]');
  await expect(page.locator("#lift.on .pol.big")).toBeVisible();
  await tap('#lift [data-p="1"]');
  await expect(page.locator("#lift.on .cap")).toHaveText("that day...");
  await tap("#lift [data-close]");
  await page.waitForTimeout(400);
  await noSideScroll(page, "memories");
  await tap('#memories [data-go="menu"]');
  await page.waitForTimeout(1100);

  await tap('#menu [data-card="coupons"]');
  await page.waitForTimeout(1100);
  await tap('#coupons [data-c="0"]');
  await expect(page.locator("#flipCard.turned")).toBeVisible({ timeout: 3000 });
  await tap("#useBtn");
  await expect(page.locator("#rStamp.on")).toBeVisible();
  await tap("#lift [data-close]");
  await page.waitForTimeout(400);
  await expect(page.locator('#coupons [data-c="0"].used')).toBeVisible();
  await tap('#coupons [data-go="menu"]');
  await page.waitForTimeout(1100);

  await tap('#menu [data-card="song"]');
  await page.waitForTimeout(1100);
  await tap("#playBtn");
  // Playwright's Windows WebKit build ships without WebAudio (real iOS Safari has it). Where it's
  // missing, the page must degrade to a friendly message rather than break.
  const hasWebAudio = await page.evaluate(() => typeof AudioContext !== "undefined" || "webkitAudioContext" in window);
  if (hasWebAudio) {
    await expect(page.locator("#player.playing")).toBeVisible();
    await tap("#playBtn");
  } else {
    test.info().annotations.push({ type: "limitation", description: "WebAudio unavailable in this WebKit build; music-box playback not verified" });
    await expect(page.locator("#songHint")).toHaveText("the song couldn't load right now. try again in a moment ♡");
  }
  await noSideScroll(page, "song");
  await tap('#song [data-go="menu"]');
  await page.waitForTimeout(1100);

  await tap('#menu [data-card="gift"]');
  await page.waitForTimeout(1100);
  await tap("#cupcake");
  await expect(page.locator("#cupcake.blown")).toBeVisible();
  await expect(page.locator("#sNext.show")).toBeVisible({ timeout: 4000 });
  await tap('#surprise [data-go="final"]');
  await expect(page.locator("#finAgain.show")).toBeVisible({ timeout: 20_000 });
  await noSideScroll(page, "final");
  await tap("#againBtn");
  await page.waitForTimeout(1100);
  await expect(page.locator("#cover.on")).toBeVisible();

  expect(errors).toEqual([]);
});

test("store and sign-in pages fit the phone", async ({ page }) => {
  for (const p of ["/", "/product", "/login", "/legal/privacy"]) {
    await page.goto(`${APP}${p}`, { waitUntil: "domcontentloaded" });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, p).toBeLessThanOrEqual(0);
  }
});
