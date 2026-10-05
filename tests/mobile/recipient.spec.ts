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
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${APP}/demo`);
  await page.waitForSelector("#app[data-hydrated]");
  await noSideScroll(page, "cover");
  await page.tap('#cover [data-go="quiz"]');
  await page.waitForTimeout(1100);
  for (let i = 0; i < 3; i++) {
    await page.locator("#qBody [data-a]").first().tap();
    await page.waitForTimeout(1300);
  }
  await expect(page.locator("#qBar")).toHaveText("ready.exe");
  await page.tap('#qBody [data-go="menu"]');
  await page.waitForTimeout(1100);
  await noSideScroll(page, "menu");

  await page.tap('#menu [data-card="letter"]');
  await page.waitForTimeout(1100);
  await page.tap("#lenv");
  await expect(page.locator("#sheet.show")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#sheet .doodle.show")).toBeVisible({ timeout: 10_000 });
  await noSideScroll(page, "letter");
  await page.tap('#letter [data-go="menu"]');
  await page.waitForTimeout(1100);

  await page.tap('#menu [data-card="memories"]');
  await page.waitForTimeout(1100);
  await page.locator('#memories [data-m="0"]').tap();
  await expect(page.locator("#lift.on .pol.big")).toBeVisible();
  await page.locator('#lift [data-p="1"]').tap();
  await expect(page.locator("#lift.on .cap")).toHaveText("that day...");
  await page.locator("#lift [data-close]").tap();
  await page.waitForTimeout(400);
  await noSideScroll(page, "memories");
  await page.tap('#memories [data-go="menu"]');
  await page.waitForTimeout(1100);

  await page.tap('#menu [data-card="coupons"]');
  await page.waitForTimeout(1100);
  await page.locator('#coupons [data-c="0"]').tap();
  await expect(page.locator("#flipCard.turned")).toBeVisible({ timeout: 3000 });
  await page.locator("#useBtn").tap();
  await expect(page.locator("#rStamp.on")).toBeVisible();
  await page.locator("#lift [data-close]").tap();
  await page.waitForTimeout(400);
  await expect(page.locator('#coupons [data-c="0"].used')).toBeVisible();
  await page.tap('#coupons [data-go="menu"]');
  await page.waitForTimeout(1100);

  await page.tap('#menu [data-card="song"]');
  await page.waitForTimeout(1100);
  await page.tap("#playBtn");
  // Playwright's Windows WebKit build ships without WebAudio (real iOS Safari has it). Where it's
  // missing, the page must degrade to a friendly message rather than break.
  const hasWebAudio = await page.evaluate(() => typeof AudioContext !== "undefined" || "webkitAudioContext" in window);
  if (hasWebAudio) {
    await expect(page.locator("#player.playing")).toBeVisible();
    await page.tap("#playBtn");
  } else {
    test.info().annotations.push({ type: "limitation", description: "WebAudio unavailable in this WebKit build; music-box playback not verified" });
    await expect(page.locator("#songHint")).toHaveText("the song couldn't load right now. try again in a moment ♡");
  }
  await noSideScroll(page, "song");
  await page.tap('#song [data-go="menu"]');
  await page.waitForTimeout(1100);

  await page.tap('#menu [data-card="gift"]');
  await page.waitForTimeout(1100);
  await page.tap("#cupcake");
  await expect(page.locator("#cupcake.blown")).toBeVisible();
  await expect(page.locator("#sNext.show")).toBeVisible({ timeout: 4000 });
  await page.tap('#surprise [data-go="final"]');
  await expect(page.locator("#finAgain.show")).toBeVisible({ timeout: 20_000 });
  await noSideScroll(page, "final");
  await page.tap("#againBtn");
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
