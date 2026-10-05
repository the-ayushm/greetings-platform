import { expect, test } from "@playwright/test";
import path from "node:path";
import { compareToBaseline } from "./compare";
import { STATES, VIEWPORTS, ready } from "./states";

/**
 * The React renderer (/demo, same content as the legacy config) must match the golden legacy
 * screenshots state by state. Allowed difference: 11% of pixels (browser rendering drift across CI/runtime updates).
 */
const MAX_RATIO = 0.11;
const BASE = path.resolve("tests/visual/baseline");
const OUT = path.resolve("test-results/visual-diff");

for (const vp of VIEWPORTS) {
  test.describe(`visual ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce", deviceScaleFactor: 1 });
    for (const state of STATES) {
      test(state.name, async ({ page, baseURL }) => {
        await page.goto(`${baseURL}/demo`);
        await ready(page);
        await state.run(page);
        await ready(page);
        const shot = await page.screenshot({ mask: (state.mask ?? []).map((s) => page.locator(s)), animations: "disabled" });
        const r = compareToBaseline(path.join(BASE, vp.name, `${state.name}.png`), shot, path.join(OUT, vp.name), state.name);
        console.log(`VISUAL ${vp.name}/${state.name} ${r.diffPixels}px ${(r.ratio * 100).toFixed(3)}%`);
        expect(r.ratio, `${vp.name}/${state.name}: ${r.diffPixels} px differ (${(r.ratio * 100).toFixed(3)}%) → ${r.diffPath}`).toBeLessThanOrEqual(MAX_RATIO);
      });
    }
  });
}
