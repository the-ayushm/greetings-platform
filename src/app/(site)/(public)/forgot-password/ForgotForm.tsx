"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Notice } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";
import { EMAIL_RE } from "@/lib/auth-rules";

export function ForgotForm({ loginHref }: { loginHref: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL_RE.test(address)) return setError("Please enter a valid email address.");
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/forgot", { method: "POST", body: { email: address } });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "That didn't work. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6">
      {sent ? (
        <div className="space-y-3" role="status" aria-live="polite">
          <h2 className="font-display text-2xl font-semibold">Check your email</h2>
          <p>
            If there&apos;s an account for <strong className="break-all">{email.trim()}</strong>, we&apos;ve sent it a link to set a new password.
          </p>
          <p className="text-ink-soft">The link works in any browser. Check your spam folder if you don&apos;t see it in a couple of minutes.</p>
          <Link href={loginHref} className="inline-block font-bold text-rose underline">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
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
          <Button type="submit" disabled={busy} className="w-full" data-testid="forgot-submit">
            {busy ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-center text-sm">
            <Link href={loginHref} className="font-bold underline">
              ← Back to sign in
            </Link>
          </p>
        </form>
      )}
    </Card>
  );
}
