"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { Button, Card, Notice } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";
import { EMAIL_RE, passwordProblem } from "@/lib/auth-rules";
import { browserDb } from "@/lib/supabase/browser";

/** Messages for links that land back here (old sign-in links, expired reset links). */
const LINK_ERRORS: Record<string, string> = {
  link_expired: "That link has expired or was already used. Sign in with your password, or use “Forgot password?” to get a new reset link.",
  different_browser: "That link has to be opened in the browser where it was requested. Sign in with your password, or use “Forgot password?”.",
  invalid_link: "That link isn't valid. Sign in with your password, or use “Forgot password?”.",
};

const NO_PASSWORD_HINT = "If you used to sign in with an email link, you don't have a password yet — use “Forgot password?” once to set one.";

type Mode = "signin" | "signup";

export function LoginForm({ next, linkError, initialMode }: { next: string; linkError?: string; initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(linkError ? (LINK_ERRORS[linkError] ?? LINK_ERRORS.invalid_link!) : null);
  const [hint, setHint] = useState(false);

  // Supabase can also report a bad link in the URL fragment (#error_code=otp_expired…).
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const code = hash.get("error_code") ?? hash.get("error");
    if (!code) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(code === "otp_expired" ? LINK_ERRORS.link_expired! : LINK_ERRORS.invalid_link!);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setHint(false);
    setConfirm("");
    const u = new URL(window.location.href);
    if (m === "signup") u.searchParams.set("mode", "signup");
    else u.searchParams.delete("mode");
    u.searchParams.delete("error");
    history.replaceState(null, "", u.pathname + u.search);
  }

  /** Full navigation so server components see the new session cookie. */
  const done = () => window.location.assign(next);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    setHint(false);
    if (!EMAIL_RE.test(address)) return setError("Please enter a valid email address.");
    if (mode === "signup") {
      const p = passwordProblem(password, confirm);
      if (p) return setError(p);
    } else if (!password) return setError("Please enter your password.");

    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const r = await api<{ signedIn: boolean }>("/api/auth/signup", { method: "POST", body: { email: address, password, confirm } });
        if (r.signedIn) return done();
        switchMode("signin");
        setError("Your account is ready — please sign in.");
        return;
      }
      const { error } = await browserDb().auth.signInWithPassword({ email: address, password });
      if (!error) return done();
      const code = (error as { code?: string }).code;
      if (error.status === 429) setError("Too many attempts. Please wait a few minutes and try again.");
      else if (code === "invalid_credentials" || error.status === 400) {
        setError("Email or password is incorrect.");
        setHint(true);
      } else if (code === "email_not_confirmed") setError("This account's email isn't confirmed yet. Use “Forgot password?” to set a password and confirm it.");
      else setError("We couldn't sign you in right now. Please try again in a moment.");
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "That didn't work. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const signup = mode === "signup";
  const forgotHref = `/forgot-password${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">{signup ? "Create your account" : "Sign in"}</h1>
      <p className="mt-2 text-ink-soft">{signup ? "Just an email and a password — you'll be signed in straight away." : "Welcome back ♡"}</p>
      <Card className="mt-6">
        <div className="mb-5 grid grid-cols-2 rounded-xl bg-baby p-1 text-sm font-bold" role="tablist" aria-label="Sign in or create an account">
          {(
            [
              ["signin", "Sign in"],
              ["signup", "Create account"],
            ] as const
          ).map(([m, label]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} className={`rounded-lg px-3 py-2 transition ${mode === m ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <label className="block">
            <span className="font-bold">Email</span>
            <input
              type="email"
              name="email"
              autoComplete={signup ? "email" : "username"}
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border-2 border-ink/30 bg-white px-3 py-2.5 focus:border-rose"
            />
          </label>
          <PasswordInput label="Password" name="password" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={setPassword} />
          {signup && (
            <>
              <PasswordInput label="Confirm password" name="confirm" autoComplete="new-password" value={confirm} onChange={setConfirm} invalid={confirm.length > 0 && confirm !== password} />
              <p className="-mt-2 text-xs text-ink-soft">At least 8 characters.</p>
            </>
          )}
          {error && (
            <Notice tone="error">
              {error}
              {hint && <span className="mt-1 block text-sm">{NO_PASSWORD_HINT}</span>}
            </Notice>
          )}
          <Button type="submit" disabled={busy} className="w-full" data-testid="auth-submit">
            {busy ? (signup ? "Creating your account…" : "Signing in…") : signup ? "Create account" : "Sign in"}
          </Button>
          {!signup && (
            <p className="text-center text-sm">
              <Link href={forgotHref} className="font-bold text-rose underline">
                Forgot password?
              </Link>
            </p>
          )}
        </form>
      </Card>
    </>
  );
}
