"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { Button, ButtonLink, Card, Notice } from "@/components/ui";
import { passwordProblem } from "@/lib/auth-rules";
import { browserDb } from "@/lib/supabase/browser";

type State = "checking" | "ready" | "invalid" | "done";

/**
 * Accepts the reset link in any of the forms Supabase can send it:
 *  - #access_token=…&refresh_token=…&type=recovery  (our implicit-flow reset email)
 *  - ?code=…                                         (PKCE, same browser)
 *  - an existing session                             (via /auth/callback, or signed in already)
 * The tokens are moved into the normal session cookie and removed from the address bar.
 */
export function ResetForm() {
  const [state, setState] = useState<State>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = browserDb();
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      const clean = () => history.replaceState(null, "", window.location.pathname);
      let ok = false;
      if (hash.get("error_code") || hash.get("error") || query.get("error_code")) {
        clean();
      } else if (hash.get("access_token") && hash.get("refresh_token")) {
        const { error } = await db.auth.setSession({ access_token: hash.get("access_token")!, refresh_token: hash.get("refresh_token")! });
        clean();
        ok = !error;
      } else if (query.get("code")) {
        const { error } = await db.auth.exchangeCodeForSession(query.get("code")!);
        clean();
        ok = !error;
      }
      const { data } = await db.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        setEmail(data.user.email ?? "");
        ok = true;
      }
      setState(ok ? "ready" : "invalid");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = passwordProblem(password, confirm);
    if (p) return setError(p);
    setBusy(true);
    setError(null);
    const { error } = await browserDb().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      const code = (error as { code?: string }).code;
      setError(
        code === "same_password"
          ? "That's the same as your current password — choose a different one."
          : code === "weak_password"
            ? "Please choose a stronger password (at least 8 characters)."
            : error.status === 401 || code === "session_expired" || code === "session_not_found"
              ? "This reset link has expired. Please request a new one."
              : "We couldn't save your new password. Please try again.",
      );
      return;
    }
    setState("done");
  }

  if (state === "checking")
    return (
      <Card className="mt-6">
        <p role="status">Checking your link…</p>
      </Card>
    );

  if (state === "invalid")
    return (
      <Card className="mt-6">
        <div className="space-y-3">
          <Notice tone="error">This reset link has expired or was already used.</Notice>
          <Link href="/forgot-password" className="inline-block font-bold text-rose underline">
            Send me a new link
          </Link>
        </div>
      </Card>
    );

  if (state === "done")
    return (
      <Card className="mt-6">
        <div className="space-y-4" role="status" aria-live="polite">
          <Notice tone="success">Your new password is saved, and you&apos;re signed in.</Notice>
          <ButtonLink href="/dashboard" className="w-full" data-testid="reset-continue">
            Continue to my sites
          </ButtonLink>
        </div>
      </Card>
    );

  return (
    <Card className="mt-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {email && (
          <p className="text-sm text-ink-soft">
            For <strong className="break-all text-ink">{email}</strong>
          </p>
        )}
        <PasswordInput label="New password" name="password" autoComplete="new-password" value={password} onChange={setPassword} />
        <PasswordInput label="Confirm new password" name="confirm" autoComplete="new-password" value={confirm} onChange={setConfirm} invalid={confirm.length > 0 && confirm !== password} />
        <p className="-mt-2 text-xs text-ink-soft">At least 8 characters.</p>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" disabled={busy} className="w-full" data-testid="reset-submit">
          {busy ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </Card>
  );
}
