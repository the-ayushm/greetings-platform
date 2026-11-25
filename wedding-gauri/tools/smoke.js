// Quick smoke test: load the local page, report console errors, take opening + hero screenshots.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const url = process.argv[2] || 'http://localhost:8080/';
  const out = process.argv[3] || path.join(__dirname, '..', 'comparison', 'smoke');
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('requestfailed', (r) => errs.push('FAILED ' + r.url()));
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(9500);
  await p.screenshot({ path: path.join(out, 'opening.png') });
  await p.mouse.click(195, 422);
  await p.waitForTimeout(8000);
  await p.screenshot({ path: path.join(out, 'hero.png') });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
