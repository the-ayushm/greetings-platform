import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolvePublicSite, signMedia } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";
import { LivePage } from "./LivePage";
import { PasscodeGate } from "./PasscodeGate";

export const dynamic = "force-dynamic";

// Link previews (WhatsApp etc.) never show names or photos: the same generic card for every site.
export const metadata: Metadata = {
  title: "A birthday surprise for you ♡",
  description: "Someone made you a little birthday surprise. Tap to open ♡",
  openGraph: { title: "A birthday surprise for you ♡", description: "Someone made you a little birthday surprise. Tap to open ♡", type: "website" },
  robots: { index: false, follow: false, nocache: true },
};

export default async function BirthdayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await resolvePublicSite(slug);
  if (!site) notFound();
  if (!(await isUnlocked(site))) return <PasscodeGate slug={slug} />;
  return <LivePage slug={slug} siteId={site.id} content={site.content} media={await signMedia(site.id, site.content)} />;
}
