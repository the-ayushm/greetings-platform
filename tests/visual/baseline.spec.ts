import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { STATES, VIEWPORTS, ready } from "./states";

/**
 * PHASE 0 — captures the golden baseline from the untouched legacy file.
 * Font rasterisation differs per OS, so baselines live under baseline/<platform>/: the Windows
 * set is committed for local runs; CI captures its own Linux set from the same legacy file
 * before comparing (npm run test:visual:baseline). The PNGs are the
 * reference every renderer change is compared against.
 */
const LEGACY = pathToFileURL(path.resolve("legacy/Your_Birthday_Surprise.html")).href;
const OUT = path.resolve("tests/visual/baseline", process.platform);

for (const vp of VIEWPORTS) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce" });
    for (const state of STATES) {
      test(state.name, async ({ page }) => {
        await page.goto(LEGACY);
        await ready(page);
        await state.run(page);
        await ready(page);
        fs.mkdirSync(path.join(OUT, vp.name), { recursive: true });
        await page.screenshot({
          path: path.join(OUT, vp.name, `${state.name}.png`),
          mask: (state.mask ?? []).map((s) => page.locator(s)),
          animations: "disabled",
        });
      });
    }
  });
}
