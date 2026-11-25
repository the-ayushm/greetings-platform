/*
 * Interaction comparison (original vs recreation) at 390px:
 * links, scratch reveal, gallery lightbox, RSVP form states, WhatsApp hand-off, music toggle.
 *   node tools/interact.js [--orig URL] [--local URL]
 */
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const ORIG = opt('--orig', 'https://aavjoo.in/i/rudra-weds-gauri');
const LOCAL = opt('--local', 'http://localhost:8080/');
const OUT = path.join(__dirname, '..', 'comparison', 'interactions');
const FIXED_NOW = Date.parse('2026-11-25T12:00:00+05:30');
const SC = 'div[lang="en"].fixed';

async function run(browser, url, tag) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((now) => {
    Date.now = () => now;
    window.open = (u) => { (window.__opened = window.__opened || []).push(u); return null; };
  }, FIXED_NOW);
  await ctx.route(/googletagmanager|google-analytics|analytics\.google|doubleclick|\/script\.js$/, (r) => r.abort());
  const page = await ctx.newPage();
  const res = { popups: [], shots: [] };


  const dir = path.join(OUT, tag);
  fs.mkdirSync(dir, { recursive: true });
  const snap = async (n) => { await page.screenshot({ path: path.join(dir, n + '.png') }); res.shots.push(n); };
  const scrollTo = async (sel, block = 'center') => {
    await page.$eval(sel, (el, b) => el.scrollIntoView({ block: b }), block);
    await page.waitForTimeout(1600);
  };

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.mouse.click(195, 422);
  await page.waitForTimeout(7500);
  res.music1 = await page.getAttribute('button[aria-label$="music"]', 'aria-label');
  await page.click('button[aria-label$="music"]');
  res.music2 = await page.getAttribute('button[aria-label$="music"]', 'aria-label');

  // links
  res.links = await page.$$eval('a[href]', (as) => as.map((a) => `${a.textContent.trim()} -> ${a.getAttribute('href')}`));

  // scratch card
  await scrollTo('canvas');
  await snap('01-scratch-foil');
  // scratch a little with the pointer
  const box = await page.$eval('canvas', (c) => { const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.mouse.move(box.x + 30, box.y + box.h / 2);
  await page.mouse.down();
  for (let i = 0; i <= 10; i++) await page.mouse.move(box.x + 30 + (i * (box.w - 60)) / 10, box.y + box.h / 2 + (i % 2 ? 20 : -20));
  await page.mouse.up();
  await page.waitForTimeout(300);
  await snap('02-scratch-partial');
  await page.getByText('Tap here to reveal instead').click();
  await page.waitForTimeout(900);
  await snap('03-scratch-confetti');
  await page.waitForTimeout(6500);
  await snap('04-scratch-revealed');

  // gallery
  await scrollTo('button[aria-label="Open photo 1 of 4"]');
  await snap('05-gallery');
  await page.$eval('button[aria-label="Open photo 1 of 4"]', (b) => b.parentElement.scrollTo({ left: b.nextElementSibling.offsetLeft - b.offsetLeft }));
  await page.waitForTimeout(1200);
  await snap('06-gallery-swiped');
  await page.click('button[aria-label="Open photo 2 of 4"]', { force: true });
  await page.waitForTimeout(900);
  await snap('07-lightbox');
  await page.click('button[aria-label="Next photo"]');
  await page.waitForTimeout(900);
  await snap('08-lightbox-next');
  await page.mouse.click(20, 120);
  await page.waitForTimeout(900);

  // RSVP
  await scrollTo('#rsvp form', 'start');
  await snap('09-rsvp');
  await page.fill('#rsvp input', 'Sharma family');
  await page.click('#rsvp button[aria-label="More guests"]');
  await page.click('#rsvp button[type=submit]');
  await page.waitForTimeout(500);
  await snap('10-rsvp-pick-error');
  await page.click('#rsvp button:has-text("Haldi")');
  await page.click('#rsvp button:has-text("Wedding")');
  await page.fill('#rsvp textarea', 'Can’t wait!');
  await page.waitForTimeout(300);
  await snap('11-rsvp-picked');
  await page.click('#rsvp button[type=submit]');
  await page.waitForTimeout(1500);
  await snap('12-rsvp-submitted');
  res.notice = await page.$eval('#rsvp', (s) => (s.querySelector('[role=status]') || {}).textContent || null);
  res.popups = await page.evaluate(() => window.__opened || []);
  await page.click('#rsvp button:has-text("Regretfully decline")');
  await page.waitForTimeout(400);
  await snap('13-rsvp-decline');
  await ctx.close();
  return res;
}

function diffPct(a, b) {
  const A = PNG.sync.read(fs.readFileSync(a)), B = PNG.sync.read(fs.readFileSync(b));
  if (A.width !== B.width || A.height !== B.height) return 100;
  return (100 * pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.12 })) / (A.width * A.height);
}

(async () => {
  const browser = await chromium.launch();
  const [o, l] = await Promise.all([run(browser, ORIG, 'orig'), run(browser, LOCAL, 'local')]);
  await browser.close();
  console.log('music  orig:', o.music1, '->', o.music2, '| local:', l.music1, '->', l.music2);
  const lo = new Set(o.links), ll = new Set(l.links);
  console.log(`links  orig=${o.links.length} local=${l.links.length}`);
  o.links.filter((x) => !ll.has(x)).forEach((x) => console.log('  only in original:', x));
  l.links.filter((x) => !lo.has(x)).forEach((x) => console.log('  only in local   :', x));
  console.log('rsvp   orig notice:', o.notice, '| popups:', o.popups);
  console.log('rsvp   local notice:', l.notice, '| popups:', l.popups.map(decodeURIComponent));
  for (const s of o.shots) console.log(s.padEnd(24), diffPct(path.join(OUT, 'orig', s + '.png'), path.join(OUT, 'local', s + '.png')).toFixed(2) + ' %');
})();
