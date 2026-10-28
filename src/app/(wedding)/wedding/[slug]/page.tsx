import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { rendererOrigin } from "@/server/env";
import { resolvePublicSite, signMedia } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";
import type { WeddingContent } from "@/templates/wedding/schema";
import { PasscodeGate } from "../../../(renderer)/birthday/[slug]/PasscodeGate";
import { WeddingLivePage } from "./WeddingLivePage";

export const dynamic = "force-dynamic";

const TITLE = "You're invited ♡";
const DESCRIPTION = "A wedding invitation, just for you. Tap to open the envelope.";

// Link previews (WhatsApp, Instagram…) never show names or photos: one generic card for every invitation.
export async function generateMetadata(): Promise<Metadata> {
  const image = `${rendererOrigin()}/og/wedding.png`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: [{ url: image, width: 1200, height: 630, alt: "A burgundy envelope closed with a wax seal" }] },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [image] },
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function WeddingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await resolvePublicSite(slug, "wedding");
  if (!site) notFound();
  if (!(await isUnlocked(site))) return <PasscodeGate slug={slug} />;
  return <WeddingLivePage slug={slug} content={site.content as WeddingContent} media={await signMedia(site.id, site.refs)} />;
}
