import { expect, test } from "@playwright/test";
import { admin } from "../helpers/db";
import { api, APP, email, linkFor, login, PASSWORD, signIn } from "./helpers";

/**
 * Email + password accounts: sign up (no email sent), sign in, mistakes, and "Forgot password?"
 * (reset link by email → new password, no old password needed — the link works in any browser).
 */
test.describe.configure({ timeout: 120_000 });

test("sign up with email + password + confirmation → signed in on `next`, no email sent", async ({ page }) => {
  const address = email("auth");
  const before = Date.now();
  await login(page, address, "/dashboard/account");
  await expect(page).toHaveURL(`${APP}/dashboard/account`);
  await expect(page.getByText(`Signed in as ${address}`)).toBeVisible();
  // Created confirmed, without sending anything.
  const { data } = await admin().auth.admin.listUsers({ perPage: 200 });
  expect(data.users.find((u) => u.email === address)?.email_confirmed_at).toBeTruthy();
  await expect(linkFor(address, before)).rejects.toThrow();
  // Already signed in → /login goes straight to the destination.
  await page.goto(`${APP}/login?next=/dashboard`);
  await expect(page).toHaveURL(`${APP}/dashboard`);
});

test("sign out, then sign back in with the password", async ({ page, browser }) => {
  const address = email("auth-in");
  await login(page, address);
  const fresh = await (await browser.newContext()).newPage();
  await signIn(fresh, address, PASSWORD, "/dashboard/account");
  await fresh.waitForURL(`${APP}/dashboard/account`);
  await expect(fresh.getByText(`Signed in as ${address}`)).toBeVisible();
  // Case and spaces in the email don't matter.
  const third = await (await browser.newContext()).newPage();
  await signIn(third, `  ${address.toUpperCase()} `);
  await third.waitForURL(`${APP}/dashboard`);
  await fresh.context().close();
  await third.context().close();
});

test("sign-up mistakes are caught: bad email, short password, mismatch, existing account", async ({ page }) => {
  await page.goto(`${APP}/login?mode=signup`);
  const fill = async (e: string, p: string, c: string) => {
    await page.getByLabel("Email").fill(e);
    await page.getByLabel("Password", { exact: true }).fill(p);
    await page.getByLabel("Confirm password", { exact: true }).fill(c);
    await page.getByTestId("auth-submit").click();
  };
  await fill("not-an-email", PASSWORD, PASSWORD);
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await fill(email("x"), "short", "short");
  await expect(page.getByText("Use at least 8 characters.", { exact: true })).toBeVisible();
  await fill(email("x"), PASSWORD, `${PASSWORD}!`);
  await expect(page.getByText("The passwords don't match.")).toBeVisible();
  // The server checks the same rules (a form can be bypassed).
  const r = await api(page).post("/api/auth/signup", { email: email("x"), password: PASSWORD, confirm: "different" });
  expect(r.status).toBe(400);
  expect((await api(page).post("/api/auth/signup", { email: email("x"), password: "short", confirm: "short" })).status).toBe(400);
  expect((await api(page, "http://evil.example").post("/api/auth/signup", { email: email("x"), password: PASSWORD, confirm: PASSWORD })).status).toBe(403);
  // Existing account.
  const taken = email("taken");
  expect((await api(page).post("/api/auth/signup", { email: taken, password: PASSWORD, confirm: PASSWORD })).status).toBe(200);
  await page.context().clearCookies();
  await page.goto(`${APP}/login?mode=signup`);
  await fill(taken, PASSWORD, PASSWORD);
  await expect(page.getByText(/An account with this email already exists/)).toBeVisible();
});

test("wrong password is refused with a helpful message", async ({ page, browser }) => {
  const address = email("auth-wrong");
  await login(page, address);
  const fresh = await (await browser.newContext()).newPage();
  await signIn(fresh, address, "not-the-password");
  await expect(fresh.getByText("Email or password is incorrect.")).toBeVisible();
  await expect(fresh.getByText(/use “Forgot password\?” once to set one/)).toBeVisible();
  await fresh.goto(`${APP}/dashboard`);
  await expect(fresh).toHaveURL(/\/login/);
  await fresh.context().close();
});

test("forgot password: email link (opened in another browser) → new password, no old one needed", async ({ page, browser }) => {
  const address = email("auth-forgot");
  await login(page, address);
  const asker = await (await browser.newContext()).newPage();
  await asker.goto(`${APP}/login`);
  await asker.getByRole("link", { name: "Forgot password?" }).click();
  await expect(asker).toHaveURL(`${APP}/forgot-password`);
  await asker.getByLabel("Email").fill(address);
  const t = Date.now();
  await asker.getByTestId("forgot-submit").click();
  await expect(asker.getByRole("heading", { name: "Check your email" })).toBeVisible();
  const link = await linkFor(address, t);

  // Opened somewhere else entirely (e.g. asked from Instagram's browser, opened from Gmail).
  const other = await (await browser.newContext()).newPage();
  await other.goto(link);
  await other.waitForURL(`${APP}/reset-password`);
  await expect(other.getByText(`For ${address}`)).toBeVisible();
  expect(other.url()).not.toContain("access_token"); // tokens are cleared from the address bar
  await other.getByLabel("New password", { exact: true }).fill("brand-new-pass-9");
  await other.getByLabel("Confirm new password", { exact: true }).fill("brand-new-pass-8");
  await other.getByTestId("reset-submit").click();
  await expect(other.getByText("The passwords don't match.")).toBeVisible();
  await other.getByLabel("Confirm new password", { exact: true }).fill("brand-new-pass-9");
  await other.getByTestId("reset-submit").click();
  await expect(other.getByText("Your new password is saved")).toBeVisible();
  await other.getByTestId("reset-continue").click();
  await expect(other).toHaveURL(`${APP}/dashboard`);

  // Old password no longer works; the new one does.
  const check = await (await browser.newContext()).newPage();
  await signIn(check, address, PASSWORD);
  await expect(check.getByText("Email or password is incorrect.")).toBeVisible();
  await signIn(check, address, "brand-new-pass-9");
  await check.waitForURL(`${APP}/dashboard`);
  // The link can't be used twice.
  const again = await (await browser.newContext()).newPage();
  await again.goto(link);
  await expect(again.getByText("This reset link has expired or was already used.")).toBeVisible();
  for (const p of [asker, other, check, again]) await p.context().close();
});

test("forgot password never reveals whether an account exists", async ({ page }) => {
  await page.goto(`${APP}/forgot-password`);
  await page.getByLabel("Email").fill(email("nobody"));
  await page.getByTestId("forgot-submit").click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
});

test("a reset page opened without a valid link offers a new one", async ({ page }) => {
  await page.goto(`${APP}/reset-password`);
  await expect(page.getByText("This reset link has expired or was already used.")).toBeVisible();
  await page.goto(`${APP}/reset-password#error=access_denied&error_code=otp_expired`);
  await expect(page.getByText("This reset link has expired or was already used.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Send me a new link" })).toHaveAttribute("href", "/forgot-password");
});

test("malformed and expired callbacks land on the login page with a message", async ({ page }) => {
  await page.goto(`${APP}/auth/callback`);
  await expect(page).toHaveURL(/\/login\?error=invalid_link/);
  await expect(page.getByText("That link isn't valid.")).toBeVisible();
  await page.goto(`${APP}/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`);
  await expect(page).toHaveURL(/\/login\?error=link_expired/);
  await expect(page.getByText("That link has expired or was already used.")).toBeVisible();
  // Off-site "next" values are ignored.
  await page.goto(`${APP}/auth/callback?next=//evil.example&error_code=otp_expired`);
  expect(new URL(page.url()).origin).toBe(APP);
});
