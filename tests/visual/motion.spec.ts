import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Motion parity (normal motion, not reduced): for each interaction, record every change to the
 * class/visibility state of the animated elements (exact timestamps) in the legacy file and in
 * /demo, and compare the timelines. Also compares the CSS animations attached on scene entry (name, duration, delay,
 * easing, iterations). Screenshots prove the frames; this proves the choreography.
 */
const LEGACY = pathToFileURL(path.resolve("legacy/Your_Birthday_Surprise.html")).href;

/** Direct DOM click: same handlers, no pointer hover side effects or stability waits. */
const tap = (p: Page, sel: string, nth = 0) => p.evaluate(([s, n]) => (document.querySelectorAll(s as string)[n as number] as HTMLElement).click(), [sel, nth] as const);

/** Navigate and wait until the page-turn has finished (the router ignores taps mid-turn). */
async function goTo(p: Page, sel: string, scene: string, nth = 0) {
  await p.waitForSelector("#wipe:not(.run)", { state: "attached" });
  await tap(p, sel, nth);
  await p.waitForSelector(`#${scene}.scene.on`);
  await p.waitForSelector("#wipe:not(.run)", { state: "attached" });
  await p.waitForTimeout(150);
}

type Probe = { name: string; setup: (p: Page) => Promise<void>; act: (p: Page) => Promise<void>; watch: string[]; ms: number };

async function toMenu(p: Page) {
  await goTo(p, '#cover [data-go="quiz"]', "quiz");
  for (let i = 0; i < 3; i++) {
    const before = await p.locator("#qDots span.on").count();
    await tap(p, "#qBody [data-a]");
    await p.waitForFunction((n) => document.querySelectorAll("#qDots span.on").length > n, before);
    await p.waitForTimeout(100);
  }
  await goTo(p, '#qBody [data-go="menu"]', "menu");
}
async function toCard(p: Page, card: string) {
  await toMenu(p);
  await goTo(p, `#menu [data-card="${card}"]`, card === "gift" ? "surprise" : card);
}

const PROBES: Probe[] = [
  { name: "page-turn wipe", setup: async () => {}, act: (p) => tap(p, '#cover [data-go="quiz"]'), watch: ["#wipe", "#cover", "#quiz"], ms: 1300 },
  {
    name: "quiz answer → next question",
    setup: (p) => goTo(p, '#cover [data-go="quiz"]', "quiz"),
    act: (p) => tap(p, "#qBody [data-a]", 1),
    watch: ["#qReply", "#qBody [data-a]", "#qBar", "#qDots span"],
    ms: 1800,
  },
  {
    name: "letter: envelope → unfolding sheet → lines → doodle",
    setup: (p) => toCard(p, "letter"),
    act: (p) => tap(p, "#lenv"),
    watch: ["#lenvWrap", "#sheet", "#sheet .ln", "#sheet .doodle"],
    ms: 8200,
  },
  {
    name: "coupon lift + auto flip + use",
    setup: (p) => toCard(p, "coupons"),
    // Both clicks are driven by the page's own clock, so runner latency can't skew timings.
    act: (p) =>
      p.evaluate(() => {
        (document.querySelector('#coupons [data-c="0"]') as HTMLElement).click();
        setTimeout(() => (document.getElementById("useBtn") as HTMLElement).click(), 1300);
      }),
    watch: ["#lift", "#flipCard", "#rStamp", "#useBtn"],
    ms: 2800,
  },
  { name: "cupcake", setup: (p) => toCard(p, "gift"), act: (p) => tap(p, "#cupcake"), watch: ["#cupcake", "#sHint", "#sNext"], ms: 2000 },
  {
    name: "final sequence",
    setup: async (p) => {
      await toCard(p, "gift");
      await tap(p, "#cupcake");
      await p.waitForSelector("#sNext.show");
      await p.waitForTimeout(700);
    },
    act: (p) => tap(p, '#surprise [data-go="final"]'),
    watch: [".pre p", "#fin", ".fin-lines span", "#finAgain"],
    ms: 13000,
  },
];

async function timeline(page: Page, url: string, probe: Probe) {
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  if (url.startsWith("http")) await page.waitForSelector("#app[data-hydrated]");
  await probe.setup(page);
  await page.evaluate((watch) => {
    const w = window as unknown as { __tl: { at: number; state: string }[] };
    w.__tl = [];
    const snap = () =>
      watch
        .map((sel) =>
          [...document.querySelectorAll(sel)]
            .map((el) => {
              const h = el as HTMLElement;
              const cls = [...h.classList].filter((c) => !["px-btn", "ln", "l-greet", "l-p", "l-sign"].includes(c)).sort().join(".");
              const disp = getComputedStyle(h).display === "none" ? "!hidden" : "";
              const text = sel === "#qReply" || sel === "#qBar" || sel === "#useBtn" || sel === "#sHint" ? `"${h.textContent}"` : "";
              return cls + disp + text;
            })
            .join(","),
        )
        .join(" | ");
    // Time zero is the probe's first click (captured before any handler runs). Every DOM change
    // after that is timestamped exactly by a MutationObserver (no polling, no sampling lag).
    const start = () => {
      const t0 = performance.now();
      // At most one snapshot per frame (snapshots force style recalculation), stamped with the
      // time of the first DOM change in that frame.
      let pendingAt: number | null = null;
      const flush = () => {
        // The port builds a scene when it is first entered (behind the page-turn), so before that
        // none of its elements exist yet. Such a state can't be seen and isn't recorded.
        if (watch.every((sel) => !document.querySelector(sel))) {
          pendingAt = null;
          return;
        }
        const state = snap();
        if (w.__tl[w.__tl.length - 1]?.state !== state) w.__tl.push({ at: Math.round(pendingAt! - t0), state });
        pendingAt = null;
      };
      const record = () => {
        if (pendingAt !== null) return;
        pendingAt = performance.now();
        requestAnimationFrame(flush);
      };
      pendingAt = t0;
      flush();
      new MutationObserver(record).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style"] });
    };
    addEventListener("click", start, { capture: true, once: true });
  }, probe.watch);
  await probe.act(page);
  // Generous margin: once an animation settles no new states appear, but a busy machine can
  // push the last transitions later than the nominal schedule.
  await page.waitForTimeout(probe.ms + 2500);
  return page.evaluate(() => (window as unknown as { __tl: { at: number; state: string }[] }).__tl);
}


test.describe("motion parity with legacy", () => {
  // Each probe records four timelines (two per page); the final sequence alone is ~15 s each.
  test.describe.configure({ mode: "serial", timeout: 480_000 });

  for (const probe of PROBES) {
    test(probe.name, async ({ browser, baseURL }) => {
      // Each page is recorded twice, one at a time. Timers can only fire late (never early) on a
      // busy machine, so the earliest time a state is seen across runs is the truest measure.
      const run = async (url: string) => {
        const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
        const tl = await timeline(page, url, probe);
        await page.context().close();
        return tl;
      };
      const earliest = (a: { at: number; state: string }[], b: { at: number; state: string }[]) =>
        a.map((x, i) => (b[i]?.state === x.state ? { ...x, at: Math.min(x.at, b[i]!.at) } : x));
      const L = earliest(await run(LEGACY), await run(LEGACY));
      const R = earliest(await run(`${baseURL}/demo`), await run(`${baseURL}/demo`));
      // Same sequence of states…
      expect(R.map((x) => x.state), "state sequence").toEqual(L.map((x) => x.state));
      // …reached at the same moments. Times are exact DOM-change timestamps; the remaining
      // difference is setTimeout scheduling delay on a loaded machine. Tolerance: 250 ms.
      // Index 0 is the starting state, not a transition: its "time" is just when recording began.
      L.forEach((x, i) => i > 0 && expect(Math.abs(R[i]!.at - x.at), `"${x.state}" at legacy ${x.at} ms vs ${R[i]!.at} ms`).toBeLessThanOrEqual(250));
    });
  }

  test("scene-entry CSS animations match", async ({ browser, baseURL }) => {
    const grab = async (url: string) => {
      const p = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
      await p.goto(url);
      if (url.startsWith("http")) await p.waitForSelector("#app[data-hydrated]");
      const out: Record<string, string[]> = {};
      const read = async (key: string) => {
        out[key] = await p.evaluate(() =>
          // Declared animations (computed style), not the ones still running at this instant:
          // timing-independent, and it covers finished entry animations too.
          [...document.querySelectorAll(".scene.on *")]
            .map((el) => {
              const s = getComputedStyle(el);
              if (s.animationName === "none") return null;
              const cls = el.getAttribute("class")?.split(" ")[0] ?? el.tagName;
              return `${cls}:${s.animationName}:${s.animationDuration}:${s.animationDelay}:${s.animationTimingFunction}:${s.animationIterationCount}:${s.animationFillMode}`;
            })
            .filter((x): x is string => x !== null)
            .sort(),
        );
      };
      await read("cover");
      await toMenu(p);
      await read("menu");
      for (const card of ["memories", "coupons", "song"]) {
        await tap(p, `#menu [data-card="${card}"]`);
        await p.waitForSelector(`#${card}.scene.on`);
        await read(card);
        await p.waitForTimeout(700); // let the page-turn finish (the router ignores taps mid-turn)
        await tap(p, `#${card} [data-go="menu"]`);
        await p.waitForSelector("#menu.scene.on");
        await p.waitForTimeout(600);
      }
      return out;
    };
    const [legacy, react] = await Promise.all([grab(LEGACY), grab(`${baseURL}/demo`)]);
    expect(react).toEqual(legacy);
  });
});
