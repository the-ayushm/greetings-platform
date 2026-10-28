"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Notice, formatDateTime } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

type Row = { id: string; kind: string; label: string; value: string; created_at: string };

const KIND: Record<string, string> = { text: "Answer", slider: "Love meter", coupon: "Coupon redeemed" };

/** What the recipient sent back (only when "collect responses" is on in the studio). Owner-only. */
export function ResponsesPanel({ siteId, responses }: { siteId: string; responses: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string | null) {
    if (!id && !confirm("Delete all responses? This can't be undone.")) return;
    setBusy(id ?? "all");
    setError(null);
    try {
      await api(`/api/sites/${siteId}/responses`, { method: "DELETE", body: { id } });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Couldn't delete.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">Their responses</h2>
          {responses.length > 0 && (
            <Button variant="ghost" className="min-h-9 px-3 py-1.5 text-sm text-rose" disabled={busy !== null} onClick={() => void remove(null)}>
              Delete all
            </Button>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Only you can see these. They&apos;re saved only if you switch on <b>Collect their responses</b> in the studio (Sections tab) and publish.
        </p>
        {error && (
          <div className="mt-3">
            <Notice tone="error">{error}</Notice>
          </div>
        )}
        {responses.length === 0 ? (
          <p className="mt-4 rounded-lg bg-baby px-3 py-3 text-sm text-ink-soft">No responses yet ♡</p>
        ) : (
          <ul className="mt-4 space-y-2" data-testid="responses">
            {responses.map((r) => (
              <li key={r.id} className="rounded-lg border-2 border-ink/10 bg-cream px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">
                    {KIND[r.kind] ?? r.kind} · {formatDateTime(r.created_at)}
                  </p>
                  <button type="button" className="text-xs font-bold text-rose underline disabled:opacity-40" disabled={busy !== null} onClick={() => void remove(r.id)} aria-label="Delete this response">
                    Delete
                  </button>
                </div>
                <p className="mt-1 font-bold break-words">{r.label}</p>
                <p className="mt-0.5 whitespace-pre-wrap break-words">{r.kind === "slider" ? `${r.value} / 100 ♡` : r.kind === "coupon" ? "They redeemed this coupon ♡" : r.value}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
