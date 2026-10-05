// Lighthouse (mobile, simulated 4G + 4× CPU slowdown) against the running production build.
// Usage: npm run build && npm start, then: node scripts/lighthouse.mjs [url ...]
// Fails (exit 1) if a page misses the budget below.
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const BUDGET = { performance: 0.85, accessibility: 0.95, "best-practices": 0.9, lcpMs: 2500, cls: 0.1, tbtMs: 300 };
const urls = process.argv.slice(2).length ? process.argv.slice(2) : ["http://app.localhost:3000/demo", "http://app.localhost:3000/"];

const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox"] });
let failed = false;
try {
  for (const url of urls) {
    const { lhr } = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices"] });
    const a = lhr.audits;
    const r = {
      url,
      performance: lhr.categories.performance.score,
      accessibility: lhr.categories.accessibility.score,
      "best-practices": lhr.categories["best-practices"].score,
      lcpMs: Math.round(a["largest-contentful-paint"].numericValue),
      fcpMs: Math.round(a["first-contentful-paint"].numericValue),
      tbtMs: Math.round(a["total-blocking-time"].numericValue),
      cls: Number(a["cumulative-layout-shift"].numericValue.toFixed(3)),
      transferKB: Math.round(a["total-byte-weight"].numericValue / 1024),
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
