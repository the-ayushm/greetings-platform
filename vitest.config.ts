import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve("src"),
      // The real package throws outside a React Server environment; tests import server modules directly.
      "server-only": path.resolve("tests/helpers/server-only-stub.ts"),
    },
  },
  test: {
    setupFiles: ["tests/helpers/load-env.ts"],
    projects: [
      { extends: true, test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" } },
      { extends: true, test: { name: "db", include: ["tests/db/**/*.test.ts"], environment: "node", testTimeout: 60_000, hookTimeout: 120_000, fileParallelism: false } },
    ],
  },
});
