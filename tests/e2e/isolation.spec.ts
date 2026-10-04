import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { DEMO_CONTENT } from "@/templates/scrapbook/defaults";
import { admin } from "../helpers/db";
import { api, APP, buySite, newCustomer, RENDERER, uploadFile } from "./helpers";

/**
 * App-level isolation (IDOR) with three real customers. B and C try every customer API and page
 * against A's order, site and files. Every attempt must fail the same way as a missing resource.
 */
test.describe.configure({ mode: "serial", timeout: 240_000 });

let A: { page: Page; siteId: string; orderId: string; assetId: string; slug: string };
let B: { page: Page; siteId: string };
let C: { page: Page };

test.beforeAll(async ({ browser }) => {
  const [a, b, c] = await Promise.all([newCustomer(browser, "idor-a"), newCustomer(browser, "idor-b"), newCustomer(browser, "idor-c")]);
  const [aSite, bSite] = await Promise.all([buySite(a.page), buySite(b.page)]);
  const up = await uploadFile(a.page, aSite, "image", fs.readFileSync("tests/fixtures/photo.png"), "image/png", "a.png");
  expect(up.status).toBe(200);
  const db = admin();
  const { data: s } = await db.from("sites").select("order_id, draft_content, draft_revision").eq("id", aSite).single();
  const content = s!.draft_content as Record<string, unknown> & { cover: { photo: unknown } };
  content.recipientName = "Alice-Secret";
  content.senderName = "A";
  content.cover.photo = { assetId: up.assetId };
  expect((await api(a.page).put(`/api/sites/${aSite}/draft`, { content, revision: s!.draft_revision })).status).toBe(200);
  const pub = await api(a.page).post(`/api/sites/${aSite}/publish`);
  expect(pub.status).toBe(200);
  A = { page: a.page, siteId: aSite, orderId: s!.order_id, assetId: up.assetId!, slug: (pub.json as { slug: string }).slug };
  B = { page: b.page, siteId: bSite };
  C = { page: c.page };
});

test("B and C cannot read, change, publish, share or delete A's site", async () => {
  for (const attacker of [B.page, C.page]) {
    const x = api(attacker);
    const { data } = await admin().from("sites").select("draft_revision").eq("id", A.siteId).single();
    const results = await Promise.all([
      x.get(`/api/orders/${A.orderId}`),
      x.put(`/api/sites/${A.siteId}/draft`, { content: { ...DEMO_CONTENT, recipientName: "Hijacked" }, revision: data!.draft_revision }),
      x.post(`/api/sites/${A.siteId}/publish`),
      x.post(`/api/sites/${A.siteId}/unpublish`),
      x.post(`/api/sites/${A.siteId}/rotate-link`),
      x.put(`/api/sites/${A.siteId}/passcode`, { passcode: "0000" }),
      x.get(`/api/sites/${A.siteId}/assets`),
      x.post(`/api/sites/${A.siteId}/assets`, { kind: "image", mime: "image/png", bytes: 100, filename: "x.png" }),
      x.post(`/api/assets/${A.assetId}/complete`),
      x.del(`/api/assets/${A.assetId}`),
      x.del(`/api/sites/${A.siteId}`, { confirm: "DELETE" }),
    ]);
    for (const r of results) expect(r.status, JSON.stringify(r.json)).toBe(404);
  }
  // A's site is untouched.
  const { data: s } = await admin().from("sites").select("status, slug, passcode_hash").eq("id", A.siteId).single();
  expect(s).toEqual({ status: "published", slug: A.slug, passcode_hash: null });
  expect((await fetch(`${RENDERER}/birthday/${A.slug}`)).status).toBe(200);
});

test("B cannot attach A's photo to B's own site", async () => {
  const { data: s } = await admin().from("sites").select("draft_content, draft_revision").eq("id", B.siteId).single();
  const content = s!.draft_content as { cover: { photo: unknown } };
  content.cover.photo = { assetId: A.assetId };
  const r = await api(B.page).put(`/api/sites/${B.siteId}/draft`, { content, revision: s!.draft_revision });
  expect(r.status).toBe(400);
  expect(JSON.stringify(r.json)).toContain("isn't available");
});

test("B cannot open A's editor, preview, share page or order page", async () => {
  for (const path of [`/dashboard/sites/${A.siteId}`, `/dashboard/sites/${A.siteId}/edit`, `/preview/${A.siteId}`, `/dashboard/orders/${A.orderId}`]) {
    const res = await B.page.goto(`${APP}${path}`);
    expect(res!.status(), path).toBe(404);
    expect(await B.page.content()).not.toContain("Alice-Secret");
  }
});

test("each dashboard and export lists only the owner's data", async () => {
  await B.page.goto(`${APP}/dashboard`);
  await expect(B.page.getByRole("heading", { name: /For / })).toHaveCount(1);
  expect(await B.page.content()).not.toContain("Alice-Secret");
  await C.page.goto(`${APP}/dashboard`);
  await expect(C.page.getByText("nothing here yet")).toBeVisible();
  const exp = await C.page.request.get(`${APP}/api/account/export`);
  const body = await exp.text();
  expect(body).not.toContain("Alice-Secret");
  expect(JSON.parse(body).sites).toEqual([]);
  const expA = await A.page.request.get(`${APP}/api/account/export`);
  expect(await expA.text()).toContain("Alice-Secret");
});

test("signed-out requests are refused", async ({ request }) => {
  const x = api({ request });
  for (const r of await Promise.all([
    x.get(`/api/orders/${A.orderId}`),
    x.put(`/api/sites/${A.siteId}/draft`, { content: {}, revision: 1 }),
    x.post(`/api/sites/${A.siteId}/publish`),
    x.post(`/api/checkout`, { productId: "00000000-0000-4000-8000-000000000000" }),
    x.get(`/api/account/export`),
    x.get(`/api/sites/${A.siteId}/assets`),
  ])) {
    expect([400, 401]).toContain(r.status);
    if (r.status === 400) expect(r.json).toMatchObject({ error: { code: "bad_request" } });
  }
});

test("requests from another origin are refused (CSRF), even with a valid session", async () => {
  const x = api(A.page, "https://evil.example");
  const r = await x.raw("POST", `${APP}/api/sites/${A.siteId}/unpublish`, {});
  expect(r.status).toBe(403);
  const r2 = await api(A.page).raw("POST", `${APP}/api/sites/${A.siteId}/rotate-link`, {}, { origin: RENDERER });
  expect(r2.status).toBe(403);
  const { data } = await admin().from("sites").select("status").eq("id", A.siteId).single();
  expect(data!.status).toBe("published");
});

test("invalid ids are rejected without touching the database", async () => {
  const x = api(B.page);
  for (const id of ["not-a-uuid", "1 or 1=1", "../../etc/passwd", "%00"]) {
    const r = await x.post(`/api/sites/${encodeURIComponent(id)}/publish`);
    expect([400, 404]).toContain(r.status);
  }
});
