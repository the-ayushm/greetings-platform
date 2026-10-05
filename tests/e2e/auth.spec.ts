import { expect, test } from "@playwright/test";
import { APP, email, linkFor } from "./helpers";

/** Supabase magic-link sign-in: email → "Check your email" → link → /auth/callback → session. */
test.describe.configure({ timeout: 120_000 });

async function requestLink(page: import("@playwright/test").Page, address: string, next = "/dashboard") {
  await page.goto(`${APP}/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(address);
  const t = Date.now();
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  return t;
}

test("sign in with the emailed link, land on next, and skip /login when signed in", async ({ page }) => {
  const address = email("auth");
  const t = await requestLink(page, address, "/dashboard/account");
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await expect(page.getByText(address)).toBeVisible();
  await expect(page.getByLabel("6-digit code")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Resend link in \d+s/ })).toBeDisabled();

  const link = await linkFor(address, t);
  expect(link).toContain("/auth/v1/verify");
  expect(decodeURIComponent(link)).toContain(`${APP}/auth/callback`);
  await page.goto(link);
  await page.waitForURL(`${APP}/dashboard/account`);
  await expect(page.getByText(`Signed in as ${address}`)).toBeVisible();

  // Already signed in → /login goes straight to the destination.
  await page.goto(`${APP}/login?next=/dashboard`);
  await expect(page).toHaveURL(`${APP}/dashboard`);
});

test("a link that was already used is rejected with a clear message", async ({ page, browser }) => {
  const address = email("auth-reuse");
  const t = await requestLink(page, address);
  const link = await linkFor(address, t);
  await page.goto(link);
  await page.waitForURL(`${APP}/dashboard`);
  // Same link again in a fresh browser: Supabase reports it as expired/used.
  const other = await (await browser.newContext()).newPage();
  await other.goto(link);
  await expect(other).toHaveURL(/\/login/);
  await expect(other.getByRole("alert").filter({ hasText: /expired|isn't valid|same browser/ })).toBeVisible();
  await other.context().close();
});

test("opening the link in a different browser explains what to do", async ({ page, browser }) => {
  const address = email("auth-other");
  const t = await requestLink(page, address);
  const link = await linkFor(address, t);
  const other = await (await browser.newContext()).newPage();
  await other.goto(link);
  await expect(other).toHaveURL(/\/login\?error=different_browser/);
  await expect(other.getByText("open the sign-in link in the same browser")).toBeVisible();
  // …and it never created a session there.
  await other.goto(`${APP}/dashboard`);
  await expect(other).toHaveURL(/\/login/);
  await other.context().close();
});

test("malformed and expired callbacks land on the login page with a message", async ({ page }) => {
  await page.goto(`${APP}/auth/callback`);
  await expect(page).toHaveURL(/\/login\?error=invalid_link/);
  await expect(page.getByText("That sign-in link isn't valid")).toBeVisible();
  await page.goto(`${APP}/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`);
  await expect(page).toHaveURL(/\/login\?error=link_expired/);
  await expect(page.getByText("That sign-in link has expired or was already used")).toBeVisible();
  await page.goto(`${APP}/login#error=access_denied&error_code=otp_expired`);
  await expect(page.getByText("That sign-in link has expired or was already used")).toBeVisible();
  // Off-site "next" values are ignored.
  await page.goto(`${APP}/auth/callback?next=//evil.example&error_code=otp_expired`);
  expect(new URL(page.url()).origin).toBe(APP);
});

test("an invalid email address is caught before sending", async ({ page }) => {
  await page.goto(`${APP}/login`);
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Check your email" })).toHaveCount(0);
});
