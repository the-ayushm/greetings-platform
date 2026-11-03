import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { rendererOrigin } from "@/server/env";
import { resolvePublicSite, signMedia } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";
import type { AskContent } from "@/templates/doyouloveme/schema";
import { PasscodeGate } from "../../birthday/[slug]/PasscodeGate";
import { AskLivePage } from "./AskLivePage";

export const dynamic = "force-dynamic";

const TITLE = "I have a little question for you ♡";
const DESCRIPTION = "Someone has something important to ask you. Tap to open ♡";

// Link previews (WhatsApp, Instagram…) never show names or photos: one generic card for every page.
export async function generateMetadata(): Promise<Metadata> {
  const image = `${rendererOrigin()}/og/do-you-love-me.png`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: [{ url: image, width: 1200, height: 630, alt: "A little card asking “Do you love me?” with Yes and No buttons" }] },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [image] },
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AskPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await resolvePublicSite(slug, "doyouloveme");
  if (!site) notFound();
  if (!(await isUnlocked(site))) return <PasscodeGate slug={slug} />;
  return <AskLivePage slug={slug} content={site.content as AskContent} media={await signMedia(site.id, site.refs)} />;
}
