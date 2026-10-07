"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Notice } from "@/components/ui";
import { browserDb } from "@/lib/supabase/browser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_SECONDS = 60;

export function LoginForm({ next }: { next: string }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    const address = email.trim();
    if (!EMAIL.test(address)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await browserDb().auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setError(
        error.status === 429
          ? "Too many requests. Please wait a few minutes and try again."
          : error.status != null && error.status >= 500
            ? "We couldn't send the email right now. Please try again in a few minutes."
            : "Couldn't send a code to that address. Please check it and try again.",
      );
      return;
    }
    setStep("code");
    setCooldown(RESEND_SECONDS);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\s/g, "");
    if (token.length !== 6 || !/^\d+$/.test(token)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await browserDb().auth.verifyOtp({ email: email.trim(), token, type: "email" });
    setBusy(false);
    if (error) {
      setError(
        error.status === 429
          ? "Too many attempts. Please wait a few minutes."
          : "That code is incorrect or has expired. Try again or request a new code.",
      );
      return;
    }
    window.location.href = next;
  }

  return (
    <Card className="mt-6">
      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-4" noValidate>
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
            {busy ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4" noValidate>
          <p>
            We&apos;ve sent a 6-digit code to <strong className="break-all">{email.trim()}</strong>.
          </p>
          <label className="block">
            <span className="font-bold">Enter code</span>
            <input
              ref={codeRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="mt-1 block w-full rounded-lg border-2 border-ink/30 bg-white px-3 py-2.5 text-center text-2xl font-bold tracking-widest focus:border-rose"
            />
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Verifying…" : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={busy || cooldown > 0}
            onClick={() => void sendCode()}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </Button>
          <button
            type="button"
            className="w-full text-sm font-bold text-ink-soft underline"
            onClick={() => { setStep("email"); setCode(""); setError(null); }}
          >
            Use a different email
          </button>
        </form>
      )}
    </Card>
  );
}
