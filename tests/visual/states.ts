import type { Page } from "@playwright/test";

/**
 * One list of experience states, driven only through the DOM contract the legacy file and the
 * React renderer share (scene ids, class names, data-* attributes). The same list produces the
 * golden baseline from legacy/Your_Birthday_Surprise.html and the regression shots of /demo.
 *
 * Runs with prefers-reduced-motion: reduce, which the original honours (animations end
 * instantly, timers are clamped to 60 ms, confetti/pops are skipped), so every state settles
 * deterministically.
 */

export const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 740 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
] as const;

const settle = (page: Page, ms = 350) => page.waitForTimeout(ms);

async function click(page: Page, selector: string, ms = 350) {
  await page.locator(selector).first().click();
  await settle(page, ms);
}

async function scrollScene(page: Page, to: "bottom" | "top") {
  await page.evaluate((where) => {
    const s = document.querySelector<HTMLElement>(".scene.on");
    if (s) s.scrollTop = where === "bottom" ? s.scrollHeight : 0;
  }, to);
  await settle(page, 150);
}

async function toQuiz(page: Page) {
  await click(page, '#cover [data-go="quiz"]');
}
async function toMenu(page: Page) {
  await toQuiz(page);
  for (let i = 0; i < 3; i++) await click(page, "#qBody [data-a]");
  await click(page, '#qBody [data-go="menu"]');
}
async function openCard(page: Page, card: string) {
  await toMenu(page);
  await click(page, `#menu [data-card="${card}"]`);
}

export type VisualState = {
  name: string;
  run: (page: Page) => Promise<void>;
  /** Selectors whose pixels legitimately differ run to run (e.g. a live audio clock). */
  mask?: string[];
};

export const STATES: VisualState[] = [
  { name: "01-cover", run: async () => {} },
  { name: "02-quiz-q1", run: toQuiz },
  { name: "04-quiz-q2", run: async (p) => { await toQuiz(p); await click(p, "#qBody [data-a]"); } },
  { name: "05-quiz-ready", run: async (p) => { await toQuiz(p); for (let i = 0; i < 3; i++) await click(p, "#qBody [data-a]"); } },
  { name: "06-menu", run: toMenu },
  { name: "07-letter-closed", run: (p) => openCard(p, "letter") },
  { name: "08-letter-open", run: async (p) => { await openCard(p, "letter"); await click(p, "#lenv", 1500); } },
  { name: "09-letter-open-bottom", run: async (p) => { await openCard(p, "letter"); await click(p, "#lenv", 1500); await scrollScene(p, "bottom"); } },
  { name: "10-menu-after-letter", run: async (p) => { await openCard(p, "letter"); await click(p, '#letter [data-go="menu"]'); } },
  { name: "11-memories", run: (p) => openCard(p, "memories") },
  { name: "12-memories-bottom", run: async (p) => { await openCard(p, "memories"); await scrollScene(p, "bottom"); } },
  { name: "13-memories-lightbox", run: async (p) => { await openCard(p, "memories"); await click(p, '#memories [data-m="2"]'); } },
  { name: "14-memories-lightbox-next", run: async (p) => { await openCard(p, "memories"); await click(p, '#memories [data-m="2"]'); await click(p, '#lift [data-p="3"]'); } },
  { name: "15-coupons", run: (p) => openCard(p, "coupons") },
  { name: "16-coupons-bottom", run: async (p) => { await openCard(p, "coupons"); await scrollScene(p, "bottom"); } },
  { name: "17-coupon-flipped", run: async (p) => { await openCard(p, "coupons"); await click(p, '#coupons [data-c="1"]', 900); } },
  { name: "18-coupon-used", run: async (p) => { await openCard(p, "coupons"); await click(p, '#coupons [data-c="1"]', 900); await click(p, "#useBtn"); } },
  { name: "19-coupons-after-use", run: async (p) => { await openCard(p, "coupons"); await click(p, '#coupons [data-c="1"]', 900); await click(p, "#useBtn"); await click(p, "#lift [data-close]"); } },
  { name: "20-song", run: (p) => openCard(p, "song") },
  { name: "21-song-bottom", run: async (p) => { await openCard(p, "song"); await scrollScene(p, "bottom"); } },
  { name: "22-surprise", run: (p) => openCard(p, "gift") },
  { name: "23-surprise-blown", run: async (p) => { await openCard(p, "gift"); await click(p, "#cupcake", 1200); } },
  { name: "24-final", run: async (p) => { await openCard(p, "gift"); await click(p, "#cupcake", 1200); await click(p, '#surprise [data-go="final"]', 2500); } },
  { name: "25-final-bottom", run: async (p) => { await openCard(p, "gift"); await click(p, "#cupcake", 1200); await click(p, '#surprise [data-go="final"]', 2500); await scrollScene(p, "bottom"); } },
  { name: "26-restart-cover", run: async (p) => { await openCard(p, "gift"); await click(p, "#cupcake", 1200); await click(p, '#surprise [data-go="final"]', 2500); await click(p, "#againBtn"); } },
];

/** Wait until web fonts are in and nothing is mid-layout. */
export async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(250);
  // Under reduced motion every animation is finite; finishing them (including ones still in an
  // animation-delay) makes the captured frame independent of exactly when the shot is taken.
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        /* infinite animation: leave as is */
      }
    }
  });
}
