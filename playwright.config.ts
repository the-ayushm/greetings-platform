import { defineConfig, devices } from "@playwright/test";

/**
 * Test projects:
 *   visual  — React renderer vs the legacy golden baseline (Chromium, reduced motion)
 *   e2e     — full customer journey, isolation, payments, uploads, security (Chromium)
 *   mobile  — recipient experience on iPhone (WebKit) and Android (Chromium) emulation
 *   a11y    — axe-core scans
 *
 * Needs: local Supabase (`npm run db:start`), the Razorpay mock (started below) and the app.
 * PW_SERVER=prod runs against `next build && next start`; default is `next dev`.
 */
const APP = process.env.APP_ORIGIN ?? "http://app.localhost:3000";
const prod = process.env.PW_SERVER === "prod";

export default defineConfig({
  testDir: "tests",
  testIgnore: ["**/baseline.spec.ts", "**/unit/**", "**/db/**"],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: APP, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "visual", testMatch: ["visual/regression.spec.ts", "visual/motion.spec.ts"], use: { ...devices["Desktop Chrome"] } },
    { name: "e2e", testMatch: "e2e/**/*.spec.ts", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-ios", testMatch: "mobile/**/*.spec.ts", use: { ...devices["iPhone 13"] } },
    { name: "mobile-android", testMatch: "mobile/**/*.spec.ts", use: { ...devices["Pixel 7"] } },
    { name: "a11y", testMatch: "a11y/**/*.spec.ts", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "node tests/mocks/razorpay-mock.mjs",
      url: "http://127.0.0.1:4010/health",
      reuseExistingServer: true,
      stdout: "pipe",
    },
    {
      command: prod ? "npm run start" : "npm run dev",
      url: `${APP}/api/health`,
      reuseExistingServer: true,
      timeout: 240_000,
      stdout: "pipe",
    },
  ],
});
