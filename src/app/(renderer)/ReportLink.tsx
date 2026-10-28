"use client";

import { useState } from "react";

const REASONS = [
  ["harassment", "Harassment or bullying"],
  ["explicit", "Explicit content"],
  ["copyright", "Copyright (e.g. music)"],
  ["impersonation", "Impersonation"],
  ["other", "Something else"],
] as const;

/** The quiet "report" link + dialog shown on every recipient page. */
export function ReportLink({ slug }: { slug: string }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  return (
    <>
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

/** Counted only after the page has been open a moment (bots that fetch previews don't run this). */
export function pingView(slug: string) {
  void fetch("/api/r/view", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }), keepalive: true }).catch(() => undefined);
}
