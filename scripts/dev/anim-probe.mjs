import { chromium } from "@playwright/test";
import path from "node:path"; import { pathToFileURL } from "node:url";
const b = await chromium.launch();
for (const url of [pathToFileURL(path.resolve("legacy/Your_Birthday_Surprise.html")).href, "http://app.localhost:3000/demo"]) {
  const ctx = await b.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(400);
  const info = await p.evaluate(() => [...document.querySelectorAll("#cover .spark")].map(s => { const cs = getComputedStyle(s); const a = s.getAnimations()[0]; return { style: s.getAttribute("style"), dur: cs.animationDuration, it: cs.animationIterationCount, delay: cs.animationDelay, op: cs.opacity, play: a?.playState, t: a?.currentTime }; }));
  console.log(url.slice(-20), JSON.stringify(info, null, 0));
  await ctx.close();
}
await b.close();
