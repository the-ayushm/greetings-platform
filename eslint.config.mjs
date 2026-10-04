import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "legacy/**", "supabase/**", "coverage/**", "test-results/**", "playwright-report/**", "next-env.d.ts", "Your_Birthday_Surprise.html"],
  },
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "react/no-danger": "error",
    },
  },
  {
    // Templates render customer-written content: no raw HTML, ever, and no reaching into server code.
    files: ["src/templates/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/server/*", "@/lib/supabase/*", "@/app/*"] }],
      "no-restricted-properties": ["error",
        { property: "innerHTML", message: "Templates must render customer text through JSX only." },
        { property: "outerHTML", message: "Templates must render customer text through JSX only." },
        { property: "insertAdjacentHTML", message: "Templates must render customer text through JSX only." }],
    },
  },
  {
    files: ["tests/**", "scripts/**", "*.config.*"],
    rules: { "no-console": "off" },
  },
];
export default config;
