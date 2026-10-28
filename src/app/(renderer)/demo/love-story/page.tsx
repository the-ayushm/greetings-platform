import type { Metadata } from "next";
import { DEMO_CONTENT } from "@/templates/lovestory/defaults";
import { LoveExperience } from "@/templates/lovestory/Experience";

export const metadata: Metadata = {
  title: "Demo · Our Little Universe",
  description: "Try the interactive love story website: questions, timeline, scrapbook, love letter, coupons and a final surprise.",
};

// Rendered per request so the CSP nonce reaches its scripts (a static page would be blocked).
export const dynamic = "force-dynamic";

const EMPTY_MEDIA = { images: {}, audio: {} };

/** Public sample with placeholder names and illustrated photos. `?at=timeline` opens a section. */
export default async function LoveStoryDemoPage({ searchParams }: { searchParams: Promise<{ at?: string }> }) {
  const { at } = await searchParams;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <LoveExperience content={DEMO_CONTENT} mode="demo" media={EMPTY_MEDIA} storageKey="demo" start={{ target: typeof at === "string" ? at.slice(0, 40) : null, nonce: 0 }} today={today} />;
}
