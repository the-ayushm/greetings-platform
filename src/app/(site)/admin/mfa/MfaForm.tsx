"use client";

import { useEffect, useState } from "react";
import { Button, Card, Notice } from "@/components/ui";
import { browserDb } from "@/lib/supabase/browser";

type Enroll = { factorId: string; qr: string; secret: string };

export function MfaForm() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<Enroll | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const db = browserDb();
      const { data } = await db.auth.mfa.listFactors();
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (verified) return setFactorId(verified.id);
      // Remove half-finished enrolments before starting a new one.
      for (const f of data?.all ?? []) if (f.status !== "verified") await db.auth.mfa.unenroll({ factorId: f.id });
      const { data: e, error } = await db.auth.mfa.enroll({ factorType: "totp", friendlyName: `Admin ${new Date().toISOString().slice(0, 10)}` });
      if (error || !e) return setError("Couldn't start authenticator setup.");
      setEnroll({ factorId: e.id, qr: e.totp.qr_code, secret: e.totp.secret });
      setFactorId(e.id);
    })();
  }, []);

  return (
    <Card className="mt-6">
      {enroll && (
        <div className="mb-5">
          <p className="font-bold">1. Scan with Google Authenticator, 1Password, Authy…</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enroll.qr} alt="Authenticator QR code" width={180} height={180} className="mt-3 rounded-lg border-2 border-ink/20 bg-white p-2" />
          <p className="mt-2 text-xs text-ink-soft">
            Or enter this key: <span className="font-mono break-all" data-testid="totp-secret">{enroll.secret}</span>
          </p>
          <p className="mt-4 font-bold">2. Enter the 6-digit code</p>
        </div>
      )}
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!factorId) return;
          setBusy(true);
          setError(null);
          const { error } = await browserDb().auth.mfa.challengeAndVerify({ factorId, code });
          if (error) {
            setBusy(false);
            setError("That code didn't work. Codes change every 30 seconds — try the current one.");
            return;
          }
          // Hard navigation on purpose: the session cookie just changed, so every server component must re-read it.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/admin");
        }}
      >
        <label className="block">
          <span className="font-bold">Authenticator code</span>
          <input
            name="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="mt-1 block w-full rounded-lg border-2 border-ink/30 px-3 py-2.5 text-center font-pixel text-2xl tracking-[0.5em]"
          />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" className="w-full" disabled={busy || code.length !== 6 || !factorId}>
          {busy ? "Verifying…" : "Verify"}
        </Button>
      </form>
    </Card>
  );
}
