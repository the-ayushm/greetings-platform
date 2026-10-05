// Lighthouse (mobile, simulated 4G + 4× CPU slowdown) against the running production build.
// Usage: npm run build && npm start, then: node scripts/lighthouse.mjs [url ...]
// Fails (exit 1) if a page misses the budget below.
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const BUDGET = { performance: 0.85, accessibility: 0.95, "best-practices": 0.9, lcpMs: 2500, cls: 0.1, tbtMs: 300 };
const urls = process.argv.slice(2).length ? process.argv.slice(2) : ["http://app.localhost:3000/demo", "http://app.localhost:3000/"];

// Prefer an installed Chrome (CHROME_PATH or auto-detected); Lighthouse can't always trace
// Playwright's bundled Chromium. chrome-launcher always uses a fresh temporary profile.
const installed = process.env.CHROME_PATH ?? chromeLauncher.Launcher.getInstallations()[0];
const chrome = await chromeLauncher.launch({ chromePath: installed ?? chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox"] });
let failed = false;
try {
  for (const url of urls) {
    const { lhr } = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices"] });
    if (lhr.runtimeError) throw new Error(`${url}: ${lhr.runtimeError.code} ${lhr.runtimeError.message}`);
    const a = lhr.audits;
    const num = (id) => {
      const v = a[id]?.numericValue;
      if (typeof v !== "number") throw new Error(`${url}: audit ${id} unavailable (${a[id]?.errorMessage ?? "no value"})`);
      return v;
    };
    const r = {
      url,
      performance: lhr.categories.performance.score,
      accessibility: lhr.categories.accessibility.score,
      "best-practices": lhr.categories["best-practices"].score,
      lcpMs: Math.round(num("largest-contentful-paint")),
      fcpMs: Math.round(num("first-contentful-paint")),
      tbtMs: Math.round(num("total-blocking-time")),
      cls: Number(num("cumulative-layout-shift").toFixed(3)),
      transferKB: Math.round(num("total-byte-weight") / 1024),
    };
    const misses = [];
    for (const k of ["performance", "accessibility", "best-practices"]) if (r[k] < BUDGET[k]) misses.push(`${k} ${r[k]} < ${BUDGET[k]}`);
    if (r.lcpMs > BUDGET.lcpMs) misses.push(`LCP ${r.lcpMs}ms`);
    if (r.cls > BUDGET.cls) misses.push(`CLS ${r.cls}`);
    if (r.tbtMs > BUDGET.tbtMs) misses.push(`TBT ${r.tbtMs}ms`);
    console.log(JSON.stringify({ ...r, misses }));
    if (misses.length) failed = true;
  }
} finally {
  await chrome.kill();
}
process.exitCode = failed ? 1 : 0;
