/*
 * Visual comparison: original site vs local recreation.
 *   node tools/compare.js [widths] [--orig URL] [--local URL] [--out DIR] [--only-local]
 * Captures identical interaction states on both (opening screen, after tap, then the
 * inner scroll container stepped through the whole page), with Date.now() frozen so the
 * countdown matches, and writes side-by-side PNGs + a pixel-diff report.
 */
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const WIDTHS = (args[0] && !args[0].startsWith('--') ? args[0] : '360,390,430,768,1024,1440').split(',').map(Number);
const ORIG = opt('--orig', 'https://aavjoo.in/i/rudra-weds-gauri');
const LOCAL = opt('--local', 'http://localhost:8080/');
const OUT = path.resolve(opt('--out', path.join(__dirname, '..', 'comparison')));
const HEIGHTS = { 360: 780, 390: 844, 430: 932, 768: 1024, 1024: 768, 1440: 900 };
const FIXED_NOW = Date.parse('2026-11-25T12:00:00+05:30');

async function capture(browser, url, w, dir) {
  const hgt = HEIGHTS[w] || 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  await ctx.addInitScript((now) => { Date.now = () => now; }, FIXED_NOW);
  await ctx.route(/googletagmanager|google-analytics|analytics\.google|doubleclick|\/script\.js$/, (r) => r.abort());
  const page = await ctx.newPage();
  fs.mkdirSync(dir, { recursive: true });
  const shots = [];
  const snap = async (name) => { const f = path.join(dir, `${name}.png`); await page.screenshot({ path: f }); shots.push(name); };

  await page.goto(url, { waitUntil: 'networkidle' });
  const t0 = Date.now();
  const at = async (sec) => { const ms = sec * 1000 - (Date.now() - t0); if (ms > 0) await page.waitForTimeout(ms); };
  await at(2.2); await snap('01-opening-2s');
  await at(9.5); await snap('02-opening-full');
  await page.mouse.click(w / 2, hgt / 2);
  await page.waitForTimeout(1600); await snap('03-opening-transition');
  await page.waitForTimeout(6400); await snap('04-hero');

  const scroller = 'div[lang="en"].fixed';
  const total = await page.$eval(scroller, (el) => el.scrollHeight - el.clientHeight);
  const stepPx = Math.round(hgt * 0.8);
  for (let k = 1, y = stepPx; ; k++, y += stepPx) {
    const yy = Math.min(y, total);
    await page.$eval(scroller, (el, v) => { el.scrollTop = v; }, yy);
    await page.waitForTimeout(1700);
    await snap(`10-scroll-${String(k).padStart(2, '0')}`);
    if (yy >= total) break;
  }
  await ctx.close();
  return { shots, total };
}

function diff(a, b, outFile) {
  const A = PNG.sync.read(fs.readFileSync(a));
  const B = PNG.sync.read(fs.readFileSync(b));
  const w = Math.min(A.width, B.width), hh = Math.min(A.height, B.height);
  const crop = (P) => { if (P.width === w && P.height === hh) return P; const C = new PNG({ width: w, height: hh }); PNG.bitblt(P, C, 0, 0, w, hh, 0, 0); return C; };
  const a2 = crop(A), b2 = crop(B);
  const D = new PNG({ width: w, height: hh });
  const n = pixelmatch(a2.data, b2.data, D.data, w, hh, { threshold: 0.12 });
  // side-by-side: original | recreation | diff
  const gap = 8;
  const S = new PNG({ width: w * 3 + gap * 2, height: hh });
  S.data.fill(255);
  PNG.bitblt(a2, S, 0, 0, w, hh, 0, 0);
  PNG.bitblt(b2, S, 0, 0, w, hh, w + gap, 0);
  PNG.bitblt(D, S, 0, 0, w, hh, 2 * (w + gap), 0);
  fs.writeFileSync(outFile, PNG.sync.write(S));
  return (100 * n) / (w * hh);
}

(async () => {
  const browser = await chromium.launch();
  const report = [];
  for (const w of WIDTHS) {
    const od = path.join(OUT, 'raw', `orig-${w}`), ld = path.join(OUT, 'raw', `local-${w}`);
    const [o, l] = await Promise.all([
      args.includes('--only-local') ? Promise.resolve(null) : capture(browser, ORIG, w, od),
      capture(browser, LOCAL, w, ld),
    ]);
    const shots = o ? o.shots.filter((s) => l.shots.includes(s)) : [];
    const sd = path.join(OUT, `w${w}`);
    fs.mkdirSync(sd, { recursive: true });
    const rows = shots.map((s) => ({ state: s, mismatchPct: +diff(path.join(od, `${s}.png`), path.join(ld, `${s}.png`), path.join(sd, `${s}.png`)).toFixed(2) }));
    report.push({ width: w, origScroll: o && o.total, localScroll: l.total, rows });
    console.log(`\n== ${w}px  scrollHeight orig=${o && o.total} local=${l.total}`);
    rows.forEach((r) => console.log(`${r.state.padEnd(24)} ${String(r.mismatchPct).padStart(6)} %`));
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
})();
