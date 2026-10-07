"use client";

import { useEffect, useState } from "react";
import { Button, Card, Notice } from "@/components/ui";
import { browserDb } from "@/lib/supabase/browser";

const LINK_ERRORS: Record<string, string> = {
  link_expired: "That sign-in link has expired or was already used. Enter your email to get a new one.",
  different_browser: "Please open the sign-in link in the same browser where you requested it. Enter your email to get a new link.",
  invalid_link: "That sign-in link isn't valid. Enter your email to get a new one.",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 60;

export function LoginForm({ next, linkError }: { next: string; linkError?: string }) {
  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(linkError ? (LINK_ERRORS[linkError] ?? LINK_ERRORS.invalid_link!) : null);
  const [cooldown, setCooldown] = useState(0);

  // Supabase can also report a bad link in the URL fragment (#error_code=otp_expired…).
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const code = hash.get("error_code") ?? hash.get("error");
    if (!code) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(code === "otp_expired" ? LINK_ERRORS.link_expired! : LINK_ERRORS.invalid_link!);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    const address = email.trim();
    if (!EMAIL.test(address)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", next);
    const { error } = await browserDb().auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: callback.toString() },
    });
    setBusy(false);
    if (error) {
      setError(
        error.status === 429
          ? "Too many sign-in emails were requested. Please wait a few minutes and try again."
          : error.status != null && error.status >= 500
            ? "We couldn't send the email right now. Please try again in a few minutes."
            : "We couldn't send a sign-in link to that address. Please check it and try again.",
      );
      return;
    }
    setStep("sent");
    setCooldown(RESEND_SECONDS);
  }

  return (
    <Card className="mt-6">
      {step === "email" ? (
        <form onSubmit={sendLink} className="space-y-4" noValidate>
          <label className="block">
            <span className="font-bold">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error === "Please enter a valid email address." || undefined}
              className="mt-1 block w-full rounded-lg border-2 border-ink/30 bg-white px-3 py-2.5 focus:border-rose"
            />
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Sending…" : "Send sign-in link"}
          </Button>
        </form>
      ) : (
        <div className="space-y-4" role="status" aria-live="polite">
          <h2 className="font-display text-2xl font-semibold">Check your email</h2>
          <p>
            We&apos;ve sent a sign-in link to <strong className="break-all">{email.trim()}</strong>.
          </p>
          <p className="text-ink-soft">Click the link in the email to continue. Open it in this browser, and check your spam folder if you don&apos;t see it.</p>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="button" variant="secondary" className="w-full" disabled={busy || cooldown > 0} onClick={() => void sendLink()}>
            {busy ? "Sending…" : cooldown > 0 ? `Resend link in ${cooldown}s` : "Resend link"}
          </Button>
          <button
            type="button"
            className="w-full text-sm font-bold text-ink-soft underline"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
          >
            Use a different email
          </button>
        </div>
      )}
    </Card>
  );
}
