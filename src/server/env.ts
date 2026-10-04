import "server-only";
import { z } from "zod";

/**
 * Server configuration, validated once. Secrets live only here (never NEXT_PUBLIC_*).
 * Production guard rails: live Razorpay keys must talk to the real Razorpay API, and the
 * renderer must be on a different origin from the app.
 */
const schema = z
  .object({
    APP_ORIGIN: z.url(),
    RENDERER_ORIGIN: z.url(),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
    SUPABASE_SECRET_KEY: z.string().min(20),
    RAZORPAY_KEY_ID: z.string().regex(/^rzp_(test|live)_[A-Za-z0-9]+$/),
    RAZORPAY_KEY_SECRET: z.string().min(16),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(16),
    RAZORPAY_API_BASE: z.url().default("https://api.razorpay.com"),
    APP_SECRET: z.string().min(32),
    CRON_SECRET: z.string().min(32),
    DEPLOY_ENV: z.enum(["local", "staging", "production"]).default("local"),
  })
  .superRefine((e, ctx) => {
    if (new URL(e.APP_ORIGIN).origin === new URL(e.RENDERER_ORIGIN).origin) {
      ctx.addIssue({ code: "custom", path: ["RENDERER_ORIGIN"], message: "must be a different origin from APP_ORIGIN" });
    }
    if (e.DEPLOY_ENV !== "local") {
      if (new URL(e.RAZORPAY_API_BASE).origin !== "https://api.razorpay.com") {
        ctx.addIssue({ code: "custom", path: ["RAZORPAY_API_BASE"], message: "only the real Razorpay API is allowed outside local" });
      }
      for (const k of ["APP_ORIGIN", "RENDERER_ORIGIN", "NEXT_PUBLIC_SUPABASE_URL"] as const) {
        if (!e[k].startsWith("https://")) ctx.addIssue({ code: "custom", path: [k], message: "must be https outside local" });
      }
    }
    if (e.DEPLOY_ENV === "production" && !e.RAZORPAY_KEY_ID.startsWith("rzp_live_")) {
      ctx.addIssue({ code: "custom", path: ["RAZORPAY_KEY_ID"], message: "production requires live keys" });
    }
    if (e.DEPLOY_ENV !== "production" && e.RAZORPAY_KEY_ID.startsWith("rzp_live_")) {
      ctx.addIssue({ code: "custom", path: ["RAZORPAY_KEY_ID"], message: "live keys are only allowed in production" });
    }
  });

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server configuration — ${fields}`);
  }
  cached = parsed.data;
  return cached;
}

export const appOrigin = () => new URL(env().APP_ORIGIN).origin;
export const rendererOrigin = () => new URL(env().RENDERER_ORIGIN).origin;
