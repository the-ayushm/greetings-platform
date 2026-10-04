import { expect, test, type Page } from "@playwright/test";
import { admin, totp } from "../helpers/db";
import { api, APP, buySite, newCustomer } from "./helpers";

test.describe.configure({ mode: "serial", timeout: 180_000 });

/** Answer the next browser dialogs (confirm / prompt) in order. */
function answer(page: Page, ...answers: (string | undefined)[]) {
  const handler = (d: import("@playwright/test").Dialog) => {
    void d.accept(answers.shift());
    if (!answers.length) page.off("dialog", handler);
  };
  page.on("dialog", handler);
}

let adminPage: Page;
let customer: Page;
let siteId: string;
let url: string;

test.beforeAll(async ({ browser }) => {
  const c = await newCustomer(browser, "adm-cust");
  customer = c.page;
  siteId = await buySite(customer);
  const { data } = await admin().from("sites").select("draft_content, draft_revision").eq("id", siteId).single();
  const content = { ...(data!.draft_content as object), recipientName: "Admin-Should-Not-See", senderName: "C" };
  await api(customer).put(`/api/sites/${siteId}/draft`, { content, revision: data!.draft_revision });
  url = ((await api(customer).post(`/api/sites/${siteId}/publish`)).json as { url: string }).url;
  const a = await newCustomer(browser, "adm");
  adminPage = a.page;
  await admin().from("profiles").update({ role: "admin" }).eq("email", a.email);
});

test("customers are kept out of the admin console and admin APIs", async () => {
  await customer.goto(`${APP}/admin`);
  await expect(customer).toHaveURL(`${APP}/dashboard`);
  await customer.goto(`${APP}/admin/orders`);
  await expect(customer).toHaveURL(`${APP}/dashboard`);
  const r = await api(customer).post(`/api/admin/sites/${siteId}`, { action: "disable", reason: "test" });
  expect(r.status).toBe(403);
});

test("an admin must pass TOTP MFA before seeing anything", async () => {
  await adminPage.goto(`${APP}/admin`);
  await expect(adminPage).toHaveURL(`${APP}/admin/mfa`);
  const r = await api(adminPage).post(`/api/admin/sites/${siteId}`, { action: "disable", reason: "test" });
  expect(r.json).toMatchObject({ error: { code: "mfa_required" } });
  const secret = (await adminPage.getByTestId("totp-secret").textContent())!.trim();
  await adminPage.locator('input[name="totp"]').fill("000000");
  await adminPage.getByRole("button", { name: "Verify" }).click();
  await expect(adminPage.getByText("That code didn't work")).toBeVisible();
  await adminPage.locator('input[name="totp"]').fill(totp(secret));
  await adminPage.getByRole("button", { name: "Verify" }).click();
  await expect(adminPage).toHaveURL(`${APP}/admin`);
  await expect(adminPage.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(adminPage.getByText("MFA ✓")).toBeVisible();
});

test("site pages show metadata only; viewing content requires a reason and is audited", async () => {
  await adminPage.goto(`${APP}/admin/sites/${siteId}`);
  await expect(adminPage.getByRole("heading", { name: /Site / })).toBeVisible();
  expect(await adminPage.content()).not.toContain("Admin-Should-Not-See");
  answer(adminPage, "Investigating a copyright report");
  await adminPage.getByRole("button", { name: "View content (audited)" }).click();
  await expect(adminPage.locator("pre")).toContainText("Admin-Should-Not-See");
  const { data } = await admin().from("audit_log").select("action, meta, actor_role").eq("target_id", siteId).eq("action", "admin.site.view_content");
  expect(data).toEqual([expect.objectContaining({ actor_role: "admin", meta: { reason: "Investigating a copyright report" } })]);
});

test("disabling a site turns its link off; re-enabling restores it", async () => {
  await adminPage.goto(`${APP}/admin/sites/${siteId}`);
  answer(adminPage, undefined, "Policy check");
  await adminPage.getByRole("button", { name: "Disable site" }).click();
  await expect(adminPage.getByRole("button", { name: "Re-enable" })).toBeVisible();
  expect((await fetch(url)).status).toBe(404);
  answer(adminPage, "Resolved");
  await adminPage.getByRole("button", { name: "Re-enable" }).click();
  await expect(adminPage.getByRole("button", { name: "Disable site" })).toBeVisible();
  expect((await fetch(url)).status).toBe(200);
});

test("reports queue: action a report and the site is disabled", async () => {
  await admin().from("abuse_reports").insert({ site_id: siteId, reason: "harassment", details: "test report" });
  await adminPage.goto(`${APP}/admin/reports`);
  await expect(adminPage.getByText("test report")).toBeVisible();
  answer(adminPage, undefined);
  await adminPage.getByRole("button", { name: "Disable site & close" }).first().click();
  await expect(adminPage.getByText("test report")).toHaveCount(0);
  expect((await admin().from("sites").select("status").eq("id", siteId).single()).data!.status).toBe("disabled");
  expect((await fetch(url)).status).toBe(404);
});

test("other admin pages render", async () => {
  for (const p of ["/admin/orders", "/admin/customers", "/admin/sites", "/admin/events", "/admin/catalog", "/admin/audit"]) {
    const r = await adminPage.goto(`${APP}${p}`);
    expect(r!.status(), p).toBe(200);
    await expect(adminPage.locator("h1")).toBeVisible();
  }
});
