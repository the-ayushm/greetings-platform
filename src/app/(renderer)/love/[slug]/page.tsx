import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { rendererOrigin } from "@/server/env";
import { resolvePublicSite, signMedia } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";
import type { LoveContent } from "@/templates/lovestory/schema";
import { PasscodeGate } from "../../birthday/[slug]/PasscodeGate";
import { LoveLivePage } from "./LoveLivePage";

export const dynamic = "force-dynamic";

const TITLE = "A little love story for you ♡";
const DESCRIPTION = "Someone made you a little world, just for the two of you. Tap to open ♡";

// Link previews (WhatsApp, Instagram…) never show names or photos: one generic card for every story.
export async function generateMetadata(): Promise<Metadata> {
  const image = `${rendererOrigin()}/og/love-story.png`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: [{ url: image, width: 1200, height: 630, alt: "A glowing heart under fairy lights" }] },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [image] },
    robots: { index: false, follow: false, nocache: true },
  };
}

/** Today's date in India — only the first render uses it; the page switches to the device's date. */
const todayIst = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export default async function LoveStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await resolvePublicSite(slug, "lovestory");
  if (!site) notFound();
  if (!(await isUnlocked(site))) return <PasscodeGate slug={slug} />;
  return <LoveLivePage slug={slug} content={site.content as LoveContent} media={await signMedia(site.id, site.refs)} today={todayIst()} />;
}
