"use client";

import { useState } from "react";
import { Button, Card, Notice } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

const PHRASE = "DELETE MY ACCOUNT";

export function DeleteAccount() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Card className="mt-6 border-rose">
      <h2 className="text-lg font-extrabold text-rose">Delete my account</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Deletes your login and every site you made, with all text, photos and songs. Links stop working immediately. Payment records are kept (without your
        name or email) because the law requires it.
      </p>
      <form
        className="mt-3 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api("/api/account", { method: "DELETE", body: { confirm: PHRASE } });
            // Hard navigation on purpose: the session cookie just changed, so every server component must re-read it.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign("/");
          } catch (err) {
            setBusy(false);
            setError(err instanceof ApiFailure ? err.message : "Couldn't delete your account.");
          }
        }}
      >
        <label className="block text-sm">
          Type <strong>{PHRASE}</strong> to confirm
          <input value={text} onChange={(e) => setText(e.target.value)} className="mt-1 block w-full rounded-lg border-2 border-ink/30 px-3 py-2" />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" variant="danger" disabled={busy || text !== PHRASE}>
          {busy ? "Deleting…" : "Delete everything"}
        </Button>
      </form>
    </Card>
  );
}
