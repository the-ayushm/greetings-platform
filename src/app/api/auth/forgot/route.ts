import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { emailSchema } from "@/lib/auth-rules";
import { appOrigin, env } from "@/server/env";
import { ApiError, clientIp, json, rateLimit, readJson, requireOrigin, route } from "@/server/http";
import { log } from "@/server/log";

export const dynamic = "force-dynamic";

/**
 * "Forgot password": emails a reset link. The link uses Supabase's implicit flow (tokens in
 * the URL fragment) rather than PKCE, so it works when opened in a different browser or app
 * than the one that asked for it (Instagram / WhatsApp in-app browser → Gmail → Chrome).
 * Always answers the same way whether or not the account exists (no account discovery).
 */
export const POST = route(async (req) => {
  requireOrigin(req, [appOrigin()]);
  const { email } = await readJson(req, z.object({ email: emailSchema }), 2 * 1024);
  await rateLimit("forgot-ip", clientIp(req), env().DEPLOY_ENV === "local" ? 200 : 10, 3600);
  await rateLimit("forgot-email", email, 3, 3600);

  const auth = createClient(env().NEXT_PUBLIC_SUPABASE_URL, env().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).auth;
  const { error } = await auth.resetPasswordForEmail(email, { redirectTo: `${appOrigin()}/reset-password` });
  if (error) {
    if (error.status === 429) throw new ApiError(429, "email_rate_limited", "Too many emails were sent in the last hour. Please try again a little later.");
    // Unknown address etc.: same answer as success (don't reveal which emails have accounts).
    if (error.status && error.status < 500) return json({ ok: true });
    log.error("auth.forgot_failed", error, { status: error.status ?? null });
    throw new ApiError(503, "unavailable", "We couldn't send the email right now. Please try again in a few minutes.");
  }
  return json({ ok: true });
});
