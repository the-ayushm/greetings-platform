"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Experience, type MediaMap } from "@/templates/scrapbook/Experience";
import type { ScrapbookContent } from "@/templates/scrapbook/schema";

const REASONS = [
  ["harassment", "Harassment or bullying"],
  ["explicit", "Explicit content"],
  ["copyright", "Copyright (e.g. music)"],
  ["impersonation", "Impersonation"],
  ["other", "Something else"],
] as const;

/** The recipient's page: the experience, plus quiet plumbing (view ping, media refresh, report). */
export function LivePage({ slug, siteId, content, media: initialMedia }: { slug: string; siteId: string; content: ScrapbookContent; media: MediaMap }) {
  const [media, setMedia] = useState(initialMedia);
  const refreshing = useRef<Promise<void> | null>(null);
  const lastRefresh = useRef(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    // Counted only after the page has been open a moment (bots that fetch previews don't run this).
    const t = setTimeout(() => {
      void fetch("/api/r/view", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }), keepalive: true }).catch(() => undefined);
    }, 3000);
    return () => clearTimeout(t);
  }, [slug]);

  /** Signed media URLs expire after 2 hours; fetch fresh ones once when something fails to load. */
  const onMediaError = useCallback(() => {
    if (refreshing.current || Date.now() - lastRefresh.current < 60_000) return;
    lastRefresh.current = Date.now();
    refreshing.current = fetch("/api/r/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) })
      .then((r) => (r.ok ? (r.json() as Promise<MediaMap>) : null))
      .then((m) => {
        if (m) setMedia(m);
      })
      .catch(() => undefined)
      .finally(() => {
        refreshing.current = null;
      });
  }, [slug]);

  return (
    <>
      <Experience content={content} mode="live" media={media} storageKey={siteId} onMediaError={onMediaError} />
      <button
        type="button"
        onClick={() => setReportOpen(true)}
        style={{ position: "fixed", right: 6, bottom: 4, zIndex: 30, font: "11px system-ui, sans-serif", color: "rgba(106,51,70,.45)", background: "none", border: 0, padding: 4, cursor: "pointer" }}
      >
        report
      </button>
      {reportOpen && (
        <div role="dialog" aria-modal="true" aria-label="Report this page" style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", background: "rgba(106,51,70,.45)", padding: 16 }}>
          <form
            style={{ width: "min(100%,360px)", background: "#fff8ec", border: "2.5px solid #6a3346", padding: 20, font: "15px system-ui, sans-serif", color: "#6a3346" }}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await fetch("/api/r/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, reason: f.get("reason"), details: f.get("details") ?? "" }) }).catch(() => undefined);
              setReported(true);
            }}
          >
            {reported ? (
              <p>Thank you. We&apos;ll review this page.</p>
            ) : (
              <>
                <p style={{ fontWeight: 700, marginTop: 0 }}>Report this page</p>
                {REASONS.map(([v, l], i) => (
                  <label key={v} style={{ display: "block", margin: "6px 0" }}>
                    <input type="radio" name="reason" value={v} defaultChecked={i === 0} /> {l}
                  </label>
                ))}
                <textarea name="details" maxLength={1000} placeholder="Anything we should know (optional)" style={{ width: "100%", boxSizing: "border-box", minHeight: 70, marginTop: 8, font: "inherit" }} />
                <button type="submit" style={{ marginTop: 10, minHeight: 44, width: "100%", background: "#d2475f", color: "#fff", border: 0, fontWeight: 700 }}>
                  Send report
                </button>
              </>
            )}
            <button type="button" onClick={() => setReportOpen(false)} style={{ marginTop: 8, minHeight: 40, width: "100%", background: "none", border: 0, textDecoration: "underline", color: "#6a3346" }}>
              Close
            </button>
          </form>
        </div>
      )}
    </>
  );
}
