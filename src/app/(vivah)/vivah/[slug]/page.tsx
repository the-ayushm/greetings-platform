import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appOrigin, rendererOrigin } from "@/server/env";
import { resolvePublicSite, signMedia } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";
import { toInviteData } from "@/templates/vivah/adapter";
import type { VivahContent } from "@/templates/vivah/schema";
import { PasscodeGate } from "../../../(renderer)/birthday/[slug]/PasscodeGate";
import { VivahLivePage } from "./VivahLivePage";

export const dynamic = "force-dynamic";

const TITLE = "You're invited ♡";
const DESCRIPTION = "A wedding invitation, just for you. Tap to open.";

// Link previews (WhatsApp, Instagram…) never show names or photos: one generic card for every invitation.
export async function generateMetadata(): Promise<Metadata> {
  const image = `${rendererOrigin()}/og/vivah.png`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: [{ url: image, width: 1200, height: 630, alt: "Shiv and Parvati: a hand holding jasmine and roses, a foot stepping down from the sky" }] },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [image] },
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function VivahPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await resolvePublicSite(slug, "vivah");
  if (!site) notFound();
  if (!(await isUnlocked(site))) return <PasscodeGate slug={slug} />;
  const { data, strings } = toInviteData(site.content as VivahContent, await signMedia(site.id, site.refs), { brandHref: appOrigin() });
  return <VivahLivePage slug={slug} data={data} strings={strings} />;
}
