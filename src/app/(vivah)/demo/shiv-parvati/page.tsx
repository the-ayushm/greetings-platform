import type { Metadata } from "next";
import { appOrigin } from "@/server/env";
import { shiftDemoDates, toInviteData } from "@/templates/vivah/adapter";
import { DEMO_CONTENT, DEMO_GALLERY } from "@/templates/vivah/defaults";
import { VivahStage } from "@/templates/vivah/Stage";

export const metadata: Metadata = {
  title: "Demo · Shiv–Parvati wedding invitation",
  description: "Try the interactive Shiv–Parvati wedding invitation: tap-to-open cover, scratch card, countdown, functions, gallery and WhatsApp RSVP.",
};

// Rendered per request so the CSP nonce reaches its scripts (a static page would be blocked).
export const dynamic = "force-dynamic";

const SECTIONS = new Set(["families", "scratch", "countdown", "events", "gallery", "rsvp", "closing"]);

/** Sample couple (Rudra & Gauri), always ~85 days away. `?at=events` opens a section. */
export default async function VivahDemoPage({ searchParams }: { searchParams: Promise<{ at?: string }> }) {
  const { at } = await searchParams;
  const content = shiftDemoDates(DEMO_CONTENT, 85);
  const { data, strings } = toInviteData(content, { images: {}, audio: {} }, { brandHref: appOrigin(), demoGallery: DEMO_GALLERY, demo: true });
  const target = typeof at === "string" && SECTIONS.has(at) ? at : null;
  return <VivahStage data={data} strings={strings} demo autoOpen={!!target} jump={target ? { target, nonce: 0 } : undefined} />;
}
