import { defineConfig, devices } from "@playwright/test";

// Captures the golden baseline from legacy/Your_Birthday_Surprise.html (no app server needed).
export default defineConfig({
  testDir: "tests/visual",
  testMatch: "baseline.spec.ts",
  fullyParallel: true,
  workers: 4,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], deviceScaleFactor: 1 },
});
