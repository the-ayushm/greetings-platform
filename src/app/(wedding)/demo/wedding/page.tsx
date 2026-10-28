import type { Metadata } from "next";
import { DEMO_CONTENT } from "@/templates/wedding/defaults";
import { WeddingInvitation } from "@/templates/wedding/Invitation";

export const metadata: Metadata = {
  title: "Demo · Royal Burgundy wedding invitation",
  description: "Try the interactive wedding invitation: envelope opening, countdown, schedule, venue map, dress code and RSVP.",
};

// Rendered per request so the CSP nonce reaches its scripts (a static page would be blocked).
export const dynamic = "force-dynamic";

const EMPTY_MEDIA = { images: {}, audio: {} };
const SECTIONS = new Set(["envelope", "cover", "couple", "countdown", "schedule", "location", "dresscode", "rsvp", "closing"]);

/** The sample wedding is always ~100 days away (India date), so the demo countdown is live. */
function demoDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 100 * 86_400_000));
}

/** Sample couple and venue. `?at=rsvp` opens a section. */
export default async function WeddingDemoPage({ searchParams }: { searchParams: Promise<{ at?: string }> }) {
  const { at } = await searchParams;
  const content = { ...DEMO_CONTENT, event: { ...DEMO_CONTENT.event, date: demoDate() } };
  const target = typeof at === "string" && SECTIONS.has(at) ? at : null;
  return <WeddingInvitation content={content} mode="demo" media={EMPTY_MEDIA} storageKey="demo" start={target ? { target, nonce: 0 } : undefined} />;
}
