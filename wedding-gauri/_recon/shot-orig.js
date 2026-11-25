// Capture the original site: opening screen, then after tap, full page; log network.
const { chromium } = require('playwright');
const fs = require('fs');
const url = process.argv[2] || 'https://aavjoo.in/i/rudra-weds-gauri';
const out = process.argv[3] || 'shots/orig';
const widths = (process.argv[4] || '390').split(',').map(Number);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const reqs = new Set();
    page.on('request', r => reqs.add(r.url()));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/${w}-opening.png` });
    fs.writeFileSync(`${out}/${w}-opening.html`, await page.content());
    // try to tap open
    const vp = page.viewportSize();
    await page.mouse.click(vp.width / 2, vp.height / 2);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${out}/${w}-after-open.png` });
    // scroll through to trigger in-view animations
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 400) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(150); }
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/${w}-full.png`, fullPage: true });
    fs.writeFileSync(`${out}/${w}-final.html`, await page.content());
    fs.writeFileSync(`${out}/${w}-requests.txt`, [...reqs].join('\n'));
    console.log(w, 'height', h);
    await ctx.close();
  }
  await browser.close();
})();
