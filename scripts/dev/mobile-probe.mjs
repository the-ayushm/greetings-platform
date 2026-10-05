import { chromium, webkit, devices } from "@playwright/test";
for (const [eng, dev] of [[chromium, "Pixel 7"], [webkit, "iPhone 13"]]) {
  const b = await eng.launch(); const c = await b.newContext({ ...devices[dev] }); const p = await c.newPage();
  p.on("framenavigated", (f) => console.log(dev, "nav", f === p.mainFrame() ? "MAIN" : "child", f.url()));
  p.on("console", (m) => console.log(dev, "console", m.type(), m.text().slice(0, 150)));
  const t = Date.now();
  try { const r = await p.goto("http://app.localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 }); console.log(dev, "status", r?.status(), Date.now() - t, "ms", p.url()); }
  catch (e) { console.log(dev, "ERR", e.message.split("\n")[0], Date.now() - t, "ms"); }
  await b.close();
}
