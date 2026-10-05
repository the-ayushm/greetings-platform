import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
for (const path of process.argv.slice(2)) {
  await p.goto(`http://app.localhost:3000/${path}`); await p.waitForLoadState("networkidle");
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  for (const v of r.violations) for (const n of v.nodes) console.log(path, v.id, n.target.join(" "), (n.any[0]?.message ?? "").slice(0, 160));
}
await b.close();
