import type { Metadata } from "next";
import { DEMO_CONTENT } from "@/templates/doyouloveme/defaults";
import { AskExperience } from "@/templates/doyouloveme/Experience";

export const metadata: Metadata = {
  title: "Demo · Do You Love Me?",
  description: "Try it: press No and watch Yes grow until it fills the screen — then the celebration.",
};

// Rendered per request so the CSP nonce reaches its scripts (a static page would be blocked).
export const dynamic = "force-dynamic";

const EMPTY_MEDIA = { images: {}, audio: {} };

/** Public sample with placeholder names. `?at=takeover` or `?at=finale` opens that screen. */
export default async function AskDemoPage({ searchParams }: { searchParams: Promise<{ at?: string }> }) {
  const { at } = await searchParams;
  return <AskExperience content={DEMO_CONTENT} mode="demo" media={EMPTY_MEDIA} start={{ target: typeof at === "string" ? at.slice(0, 20) : null, nonce: 0 }} />;
}
