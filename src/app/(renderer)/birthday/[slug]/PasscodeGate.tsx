"use client";

import "@/templates/scrapbook/fonts/fonts.css";
import "../../gate.css";
import { useState } from "react";

export function PasscodeGate({ slug }: { slug: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <main className="gate">
      <form
        className="gate-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const r = await fetch("/api/r/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, passcode: code }) }).catch(() => null);
          if (r?.ok) {
            window.location.reload();
            return;
          }
          setBusy(false);
          setError(r?.status === 429 ? "Too many tries. Please wait a few minutes." : "That code isn't right. Try again ♡");
        }}
      >
        <p className="gate-hand">psst…</p>
        <h1 className="gate-title">A surprise is waiting</h1>
        <p className="gate-text">Enter the secret code you were given.</p>
        <label htmlFor="code" style={{ position: "absolute", left: -9999 }}>
          Secret code
        </label>
        <input id="code" inputMode="numeric" autoComplete="off" pattern="[0-9]{4,8}" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
        <p className="gate-err" role="alert">
          {error}
        </p>
        <button type="submit" disabled={busy || code.length < 4}>
          {busy ? "Opening…" : "OPEN ♡"}
        </button>
      </form>
    </main>
  );
}
