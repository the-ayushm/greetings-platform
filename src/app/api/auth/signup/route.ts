import { signupSchema } from "@/lib/auth-rules";
import { adminDb } from "@/lib/supabase/admin";
import { userDb } from "@/lib/supabase/server";
import { appOrigin, env } from "@/server/env";
import { ApiError, badRequest, clientIp, conflict, json, rateLimit, readJson, requireOrigin, route } from "@/server/http";
import { log } from "@/server/log";

export const dynamic = "force-dynamic";

/**
 * Email + password sign-up. The account is created already confirmed (service role), so no
 * email is sent — sign-up never depends on Supabase's email sending limits or on the
 * dashboard's "Confirm email" setting. Then the visitor is signed in (session cookie).
 */
export const POST = route(async (req) => {
  requireOrigin(req, [appOrigin()]);
  const { email, password } = await readJson(req, signupSchema, 4 * 1024);
  // Generous per-IP ceiling (shared Wi-Fi / mobile carrier NAT); higher locally for the test suite.
  await rateLimit("signup", clientIp(req), env().DEPLOY_ENV === "local" ? 500 : 20, 3600);

  const { error } = await adminDb().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "email_exists" || /already (been )?registered|already exists/i.test(error.message)) {
      throw conflict("email_exists", "An account with this email already exists. Sign in instead — or use “Forgot password?” if you don't have a password yet.");
    }
    if (code === "weak_password") throw badRequest("Please choose a stronger password (at least 8 characters).");
    log.error("auth.signup_failed", error, { code });
    throw new ApiError(503, "unavailable", "We couldn't create your account right now. Please try again in a moment.");
  }

  const db = await userDb();
  const { error: signInError } = await db.auth.signInWithPassword({ email, password });
  if (signInError) {
    // Account exists; the visitor can still sign in from the form.
    log.warn("auth.signup_signin_failed", { code: (signInError as { code?: string }).code ?? null });
    return json({ ok: true, signedIn: false });
  }
  return json({ ok: true, signedIn: true });
});
