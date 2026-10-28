import "@/templates/scrapbook/fonts/fonts.css";
import "../(renderer)/gate.css";

/** Same page for unknown, rotated, unpublished, expired and disabled invitation links. */
export default function WeddingNotFound() {
  return (
    <main className="gate">
      <div className="gate-card">
        <p className="gate-hand">hmm…</p>
        <h1 className="gate-title">This invitation isn&apos;t here</h1>
        <p className="gate-text">The link may have changed, or the page is no longer available. If someone sent it to you, ask them for the latest link ♡</p>
      </div>
    </main>
  );
}
