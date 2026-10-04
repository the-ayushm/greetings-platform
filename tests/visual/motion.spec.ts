import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Motion parity (normal motion, not reduced): for each interaction, sample the class/visibility
 * state of the animated elements every 100 ms in the legacy file and in /demo, and compare the
 * timelines. Also compares the CSS animations attached on scene entry (name, duration, delay,
 * easing, iterations). Screenshots prove the frames; this proves the choreography.
 */
const LEGACY = pathToFileURL(path.resolve("legacy/Your_Birthday_Surprise.html")).href;

/** Direct DOM click: same handlers, no pointer hover side effects or stability waits. */
const tap = (p: Page, sel: string, nth = 0) => p.evaluate(([s, n]) => (document.querySelectorAll(s as string)[n as number] as HTMLElement).click(), [sel, nth] as const);

type Probe = { name: string; setup: (p: Page) => Promise<void>; act: (p: Page) => Promise<void>; watch: string[]; ms: number };

async function toMenu(p: Page) {
  await tap(p, '#cover [data-go="quiz"]');
  await p.waitForTimeout(1100);
  for (let i = 0; i < 3; i++) {
    await tap(p, "#qBody [data-a]");
    await p.waitForTimeout(1400);
  }
  await tap(p, '#qBody [data-go="menu"]');
  await p.waitForTimeout(1100);
}
async function toCard(p: Page, card: string) {
  await toMenu(p);
  await tap(p, `#menu [data-card="${card}"]`);
  await p.waitForTimeout(1100);
}

const PROBES: Probe[] = [
  { name: "page-turn wipe", setup: async () => {}, act: (p) => tap(p, '#cover [data-go="quiz"]'), watch: ["#wipe", "#cover", "#quiz"], ms: 1300 },
  {
    name: "quiz answer → next question",
    setup: async (p) => {
      await tap(p, '#cover [data-go="quiz"]');
      await p.waitForTimeout(1100);
    },
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
    act: async (p) => {
      await tap(p, '#coupons [data-c="0"]');
      await p.waitForTimeout(1300);
      await tap(p, "#useBtn");
    },
    watch: ["#lift", "#flipCard", "#rStamp", "#useBtn"],
    ms: 1500,
  },
  { name: "cupcake", setup: (p) => toCard(p, "gift"), act: (p) => tap(p, "#cupcake"), watch: ["#cupcake", "#sHint", "#sNext"], ms: 2000 },
  {
    name: "final sequence",
    setup: async (p) => {
      await toCard(p, "gift");
      await tap(p, "#cupcake");
      await p.waitForTimeout(1600);
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
    const w = window as unknown as { __tl: string[] };
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
    const t0 = performance.now();
    const iv = setInterval(() => {
      w.__tl.push(snap());
      if (performance.now() - t0 > 30000) clearInterval(iv);
    }, 100);
  }, probe.watch);
  await probe.act(page);
  await page.waitForTimeout(probe.ms);
  return page.evaluate(() => (window as unknown as { __tl: string[] }).__tl);
}

/** Collapse a sampled timeline into its sequence of distinct states with approximate times. */
function transitions(tl: string[]) {
  const out: { at: number; state: string }[] = [];
  tl.forEach((s, i) => {
    if (!out.length || out[out.length - 1]!.state !== s) out.push({ at: i * 100, state: s });
  });
  return out;
}

test.describe("motion parity with legacy", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  for (const probe of PROBES) {
    test(probe.name, async ({ browser, baseURL }) => {
      const a = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
      const b = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
      const [legacy, react] = await Promise.all([timeline(a, LEGACY, probe), timeline(b, `${baseURL}/demo`, probe)]);
      const L = transitions(legacy),
        R = transitions(react);
      // Same sequence of states…
      expect(R.map((x) => x.state), "state sequence").toEqual(L.map((x) => x.state));
      // …reached at the same moments (±250 ms sampling/scheduling jitter).
      L.forEach((x, i) => expect(Math.abs(R[i]!.at - x.at), `"${x.state}" timing`).toBeLessThanOrEqual(250));
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
          [...document.querySelectorAll(".scene.on *")]
            .flatMap((el) => el.getAnimations().map((a) => a as CSSAnimation))
            .filter((a) => "animationName" in a)
            .map((a) => {
              const t = a.effect!.getTiming();
              return `${(a.effect as KeyframeEffect).target!.className.toString().split(" ")[0]}:${a.animationName}:${t.duration}:${t.delay}:${t.easing}:${t.iterations}`;
            })
            .sort(),
        );
      };
      await read("cover");
      await toMenu(p);
      await read("menu");
      for (const card of ["memories", "coupons", "song"]) {
        await tap(p, `#menu [data-card="${card}"]`);
        await p.waitForTimeout(500);
        await read(card);
        await tap(p, `#${card} [data-go="menu"]`);
        await p.waitForTimeout(1100);
      }
      return out;
    };
    const [legacy, react] = await Promise.all([grab(LEGACY), grab(`${baseURL}/demo`)]);
    expect(react).toEqual(legacy);
  });
});
