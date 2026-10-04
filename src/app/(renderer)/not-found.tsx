import "@/templates/scrapbook/fonts/fonts.css";
import "./gate.css";

/** Same page for unknown, rotated, unpublished, expired and disabled links. */
export default function RendererNotFound() {
  return (
    <main className="gate">
      <div className="gate-card">
        <p className="gate-hand">hmm…</p>
        <h1 className="gate-title">This surprise isn&apos;t here</h1>
        <p className="gate-text">The link may have changed, or the page is no longer available. If someone sent it to you, ask them for the latest link ♡</p>
      </div>
    </main>
  );
}
