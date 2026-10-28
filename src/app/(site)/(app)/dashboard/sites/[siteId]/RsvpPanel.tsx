"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Notice, formatDateTime } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

type Row = { id: string; guest_name: string; attending: boolean; guests: number; message: string; created_at: string };

/** Spreadsheet apps run cells starting with = + - @ as formulas; prefix them so names stay text. */
const csvCell = (v: string | number) => {
  const s = String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Guests' replies to the wedding invitation. Owner-only (RLS); the owner can remove a reply so the guest can answer again. */
export function RsvpPanel({ siteId, rsvps }: { siteId: string; rsvps: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const yes = rsvps.filter((r) => r.attending);
  const guests = yes.reduce((n, r) => n + r.guests, 0);

  async function remove(id: string | null) {
    if (!confirm(id ? "Remove this reply? The guest will be able to reply again." : "Delete all replies? This can't be undone.")) return;
    setBusy(id ?? "all");
    setError(null);
    try {
      await api(`/api/sites/${siteId}/rsvps`, { method: "DELETE", body: { id } });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Couldn't delete.");
    } finally {
      setBusy(null);
    }
  }

  function download() {
    const lines = [["Name", "Attending", "Guests", "Message", "Replied at"].map(csvCell).join(",")];
    for (const r of rsvps) lines.push([r.guest_name, r.attending ? "Yes" : "No", r.guests, r.message, new Date(r.created_at).toISOString()].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "wedding-rsvps.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="mt-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">RSVPs</h2>
          {rsvps.length > 0 && (
            <div className="flex gap-1">
              <Button variant="ghost" className="min-h-9 px-3 py-1.5 text-sm" onClick={download}>
                Download CSV
              </Button>
              <Button variant="ghost" className="min-h-9 px-3 py-1.5 text-sm text-rose" disabled={busy !== null} onClick={() => void remove(null)}>
                Delete all
              </Button>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-soft">Only you can see these. Guests reply from the RSVP seal on your published invitation.</p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center" data-testid="rsvp-totals">
          {[
            ["Attending", yes.length],
            ["Guests coming", guests],
            ["Declined", rsvps.length - yes.length],
          ].map(([l, n]) => (
            <div key={l} className="rounded-lg bg-baby px-2 py-2">
              <dt className="text-xs font-bold tracking-wide text-ink-soft uppercase">{l}</dt>
              <dd className="font-pixel text-2xl text-rose">{n}</dd>
            </div>
          ))}
        </dl>
        {error && (
          <div className="mt-3">
            <Notice tone="error">{error}</Notice>
          </div>
        )}
        {rsvps.length === 0 ? (
          <p className="mt-4 rounded-lg bg-baby px-3 py-3 text-sm text-ink-soft">No replies yet ♡</p>
        ) : (
          <ul className="mt-4 space-y-2" data-testid="rsvps">
            {rsvps.map((r) => (
              <li key={r.id} className="rounded-lg border-2 border-ink/10 bg-cream px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold break-words">
                    {r.guest_name} · {r.attending ? `coming${r.guests > 1 ? ` (${r.guests} guests)` : ""}` : "can't come"}
                  </p>
                  <button type="button" className="shrink-0 text-xs font-bold text-rose underline disabled:opacity-40" disabled={busy !== null} onClick={() => void remove(r.id)} aria-label={`Remove the reply from ${r.guest_name}`}>
                    Remove
                  </button>
                </div>
                <p className="text-xs text-ink-soft">{formatDateTime(r.created_at)}</p>
                {r.message && <p className="mt-1 whitespace-pre-wrap break-words">{r.message}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
