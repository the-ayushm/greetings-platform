import { webkit, devices } from "@playwright/test";
const b = await webkit.launch(); const p = await (await b.newContext({ ...devices["iPhone 13"] })).newPage();
await p.goto("http://app.localhost:3000/demo"); await p.waitForSelector("#app[data-hydrated]");
const click = (s) => p.evaluate((s) => document.querySelector(s).click(), s);
await click('#cover [data-go="quiz"]'); await p.waitForTimeout(1100);
for (let i = 0; i < 3; i++) { await click("#qBody [data-a]"); await p.waitForTimeout(1300); }
await click('#qBody [data-go="menu"]'); await p.waitForTimeout(1100);
await click('#menu [data-card="memories"]'); await p.waitForTimeout(1100);
await p.locator('#memories [data-m="0"]').tap();
await p.waitForTimeout(1500);
const boxes = await p.evaluate(() => new Promise((res) => { const out = []; let n = 0; const f = () => { const r = document.querySelector('#lift [data-p="1"]').getBoundingClientRect(); out.push([r.x.toFixed(2), r.y.toFixed(2), r.width.toFixed(2)].join(",")); if (++n < 8) requestAnimationFrame(f); else res(out); }; requestAnimationFrame(f); }));
console.log(boxes.join(" | "));
console.log(await p.evaluate(() => { const l = document.getElementById("lift"); return { scrollTop: l.scrollTop, sh: l.scrollHeight, ch: l.clientHeight, anims: document.getAnimations().map(a => a.animationName + ":" + a.playState).filter(x => !x.startsWith("twinkle")).slice(0, 10) }; }));
await p.locator("#lift [data-close]").tap();
await p.waitForTimeout(800);
const after = await p.evaluate(() => new Promise((res) => { const out = []; let n = 0; const sc = document.getElementById("memories"); const f = () => { const r = document.querySelector('#memories .back').getBoundingClientRect(); out.push(r.y.toFixed(2) + "@" + sc.scrollTop.toFixed(1)); if (++n < 12) requestAnimationFrame(f); else res(out); }; requestAnimationFrame(f); }));
console.log("after close:", after.join(" | "), "active:", await p.evaluate(() => document.activeElement?.className));
await b.close();
