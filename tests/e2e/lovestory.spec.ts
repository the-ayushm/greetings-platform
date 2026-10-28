import { expect, test, type Page } from "@playwright/test";
import { DEMO_CONTENT } from "@/templates/lovestory/defaults";
import { admin } from "../helpers/db";
import { api, APP, newCustomer, recipient, RENDERER, stubRazorpay } from "./helpers";

/**
 * "Our Little Universe": buy through the real product page and checkout, customise via the
 * draft API, publish to /love/<slug>, walk it as the recipient, and check responses + isolation.
 */
test.describe.configure({ mode: "serial", timeout: 180_000 });

let page: Page;
let other: Page;
let siteId: string;
let url: string;

async function buyLoveStory(p: Page): Promise<string> {
  await stubRazorpay(p);
  await p.goto(`${APP}/products/love-story`);
  await p.getByTestId("love-buy").click();
  await p.getByTestId("pay").click();
  await p.waitForURL(/\/dashboard\/orders\//);
  await expect(p.getByRole("heading", { name: "Payment received" })).toBeVisible({ timeout: 30_000 });
  await p.getByTestId("start-editing").click();
  await p.waitForURL(/\/dashboard\/sites\/[0-9a-f-]+\/edit/);
  await expect(p.getByText("Customization studio")).toBeVisible();
  return p.url().match(/sites\/([0-9a-f-]{36})/)![1]!;
}

async function saveAndPublish(p: Page, id: string, content: unknown) {
  const { data } = await admin().from("sites").select("draft_revision").eq("id", id).single();
  expect((await api(p).put(`/api/sites/${id}/draft`, { content, revision: data!.draft_revision })).status).toBe(200);
  const pub = await api(p).post(`/api/sites/${id}/publish`);
  expect(pub.status).toBe(200);
  return (pub.json as { url: string }).url;
}

function story(collect: boolean) {
  const c = structuredClone(DEMO_CONTENT);
  c.people.partnerName = "Aanya";
  c.people.creatorName = "<img src=x onerror=window.__pwned=1>";
  // No uploads in this test: switch off the photo-only sections.
  for (const s of c.sections) if (s.id === "scrapbook" || s.id === "photowall") s.enabled = false;
  c.responses.collect = collect;
  return c;
}

test.beforeAll(async ({ browser }) => {
  ({ page } = await newCustomer(browser, "love"));
  ({ page: other } = await newCustomer(browser, "love-b"));
  siteId = await buyLoveStory(page);
});

test("a new purchase starts from the love story template defaults", async () => {
  const { data } = await admin().from("sites").select("template_key, draft_content").eq("id", siteId).single();
  expect(data!.template_key).toBe("lovestory");
  expect((data!.draft_content as { welcome?: { greeting?: string } }).welcome?.greeting).toBe("Hey {partner}...");
});

test("publishing needs the essentials, then gives a /love/ link", async () => {
  const pub = await api(page).post(`/api/sites/${siteId}/publish`);
  expect(pub.status).toBe(400);
  url = await saveAndPublish(page, siteId, story(false));
  expect(url).toMatch(new RegExp(`^${RENDERER}/love/[A-Za-z0-9]{22}$`));
});

test("the recipient opens it without an account; customer text stays text", async ({ browser }) => {
  const r = await recipient(browser);
  await r.page.goto(url);
  await r.page.waitForSelector(".lu[data-hydrated]");
  await expect(r.page.locator(".lu-hero")).toContainText("Hey Aanya");
  await r.page.getByRole("button", { name: /Let's Begin/ }).click();
  expect(await r.page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  await r.context.close();
});

test("responses are only stored when the creator switched collection on", async ({ request }) => {
  const slug = url.split("/").pop()!;
  const send = () => request.post(`${RENDERER}/api/r/respond`, { headers: { origin: RENDERER, "content-type": "application/json" }, data: { slug, kind: "text", itemId: "qwhatami", value: "my whole world" } });
  expect(((await (await send()).json()) as { stored: boolean }).stored).toBe(false);
  await saveAndPublish(page, siteId, story(true));
  expect(((await (await send()).json()) as { stored: boolean }).stored).toBe(true);
  // Unknown items and other kinds are refused; the label comes from the published content.
  const bad = await request.post(`${RENDERER}/api/r/respond`, { headers: { origin: RENDERER, "content-type": "application/json" }, data: { slug, kind: "slider", itemId: "qwhatami", value: "50" } });
  expect(bad.status()).toBe(404);
  await page.goto(`${APP}/dashboard/sites/${siteId}`);
  await expect(page.getByTestId("responses")).toContainText("my whole world");
  await expect(page.getByTestId("responses")).toContainText("What am I to you");
});

test("another customer can't see or delete someone else's responses or studio", async () => {
  expect((await api(other).del(`/api/sites/${siteId}/responses`, { id: null })).status).toBe(404);
  const res = await other.goto(`${APP}/dashboard/sites/${siteId}/edit`);
  expect(res?.status()).toBe(404);
  expect((await other.goto(`${APP}/preview/love/${siteId}`))?.status()).toBe(404);
  const { count } = await admin().from("site_responses").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  expect(count).toBe(1);
});

test("each origin serves only its own surface for love stories", async ({ request }) => {
  const slug = url.split("/").pop()!;
  expect((await request.get(`${APP}/love/${slug}`)).status()).toBe(404);
  // A love story slug doesn't resolve on the birthday path (and vice versa).
  expect((await request.get(`${RENDERER}/birthday/${slug}`)).status()).toBe(404);
  expect((await request.get(`${RENDERER}/products/love-story`)).status()).toBe(404);
  const og = await request.get(`${RENDERER}/og/love-story.png`);
  expect(og.status()).toBe(200);
  // Link previews are generic: no names in the page metadata.
  const html = await (await request.get(url)).text();
  expect(html).not.toContain("Aanya");
});

test("unpublish turns the link off; deleting removes responses too", async ({ request }) => {
  expect((await api(page).post(`/api/sites/${siteId}/unpublish`)).status).toBe(200);
  expect((await request.get(url)).status()).toBe(404);
  expect((await api(page).del(`/api/sites/${siteId}`, { confirm: "DELETE" })).status).toBe(200);
  const { count } = await admin().from("site_responses").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  expect(count).toBe(0);
});
