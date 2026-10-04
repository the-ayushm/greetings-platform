import "@/templates/scrapbook/fonts/fonts.css";
import "./(renderer)/gate.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Not found", robots: { index: false } };

/** Unmatched URLs on either origin. Deliberately says nothing about what exists. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="gate">
          <div className="gate-card">
            <p className="gate-hand">hmm…</p>
            <h1 className="gate-title">Nothing here</h1>
            <p className="gate-text">This page doesn&apos;t exist.</p>
          </div>
        </main>
      </body>
    </html>
  );
}
