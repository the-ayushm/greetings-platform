import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { userDb } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { appOrigin } from "@/server/env";
import { log } from "@/server/log";

export const dynamic = "force-dynamic";

const EMAIL_TYPES: EmailOtpType[] = ["magiclink", "signup", "email", "invite", "recovery", "email_change"];

/** Where to send the user when the link can't be used, with a reason the login page explains. */
function toLogin(reason: string, next: string) {
  const url = new URL("/login", appOrigin());
  url.searchParams.set("error", reason);
  if (next !== "/dashboard") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

/**
 * Target of the sign-in / confirm-email link in Supabase's email. Supabase verifies the link
 * and redirects here with either a PKCE `code` (default flow) or a `token_hash` + `type`;
 * we turn that into a session cookie, then continue to `next`.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const next = safeNext(params.get("next"));

  // Supabase reports expired / already-used links as query parameters.
  const errorCode = params.get("error_code") ?? params.get("error");
  if (errorCode) return toLogin(errorCode === "otp_expired" ? "link_expired" : "invalid_link", next);

  const db = await userDb();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  let error: { message: string; code?: string } | null = null;
  if (code) {
    ({ error } = await db.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type && EMAIL_TYPES.includes(type)) {
    ({ error } = await db.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    return toLogin("invalid_link", next);
  }

  if (error) {
    const msg = `${error.code ?? ""} ${error.message}`.toLowerCase();
    // PKCE: the link must be opened in the browser that asked for it (it holds the verifier).
    const reason = msg.includes("verifier") ? "different_browser" : msg.includes("expired") ? "link_expired" : "invalid_link";
    log.warn("auth.callback_failed", { reason, code: error.code ?? null });
    return toLogin(reason, next);
  }

  return NextResponse.redirect(new URL(next, appOrigin()));
}
