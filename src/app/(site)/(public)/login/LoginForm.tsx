"use client";

import { useState } from "react";
import { Button, Card, Notice } from "@/components/ui";
import { browserDb } from "@/lib/supabase/browser";

export function LoginForm({ next }: { next: string }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await browserDb().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) {
      setError(error.status === 429 ? "Too many codes requested. Please wait a minute and try again." : "We couldn't send a code to that address. Please check it and try again.");
      return;
    }
    setInfo(`We sent a code to ${email.trim()}. It expires in 15 minutes.`);
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await browserDb().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) {
      setBusy(false);
      setError("That code didn't work. Check the latest email, or request a new code.");
      return;
    }
    // Hard navigation on purpose: the session cookie just changed, so every server component must re-read it.
    window.location.assign(next);
  }

  return (
    <Card className="mt-6">
      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-4">
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
              className="mt-1 block w-full rounded-lg border-2 border-ink/30 bg-white px-3 py-2.5 focus:border-rose"
            />
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Sending…" : "Email me a code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          {info && <Notice>{info}</Notice>}
          <label className="block">
            <span className="font-bold">6-digit code</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              maxLength={6}
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="mt-1 block w-full rounded-lg border-2 border-ink/30 bg-white px-3 py-2.5 text-center font-pixel text-2xl tracking-[0.5em] focus:border-rose"
            />
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
            {busy ? "Checking…" : "Sign in"}
          </Button>
          <button type="button" className="w-full text-sm font-bold text-ink-soft underline" onClick={() => setStep("email")}>
            Use a different email
          </button>
        </form>
      )}
    </Card>
  );
}
