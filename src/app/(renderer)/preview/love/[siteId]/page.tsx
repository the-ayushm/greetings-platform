import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUserPage } from "@/server/auth";
import { ApiError, isUuid } from "@/server/http";
import { getOwnedSite, signMedia } from "@/server/sites";
import { newSiteContent } from "@/templates/lovestory/defaults";
import { draftContentSchema, referencedAssets } from "@/templates/lovestory/schema";
import { LovePreviewClient } from "./LovePreviewClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Owner-only preview of a love story DRAFT, embedded by the studio (same origin, never the public renderer). */
export default async function LovePreviewPage({ params, searchParams }: { params: Promise<{ siteId: string }>; searchParams: Promise<{ at?: string }> }) {
  const { siteId } = await params;
  const { at } = await searchParams;
  const user = await requireUserPage(`/dashboard/sites/${siteId}/edit`);
  if (!isUuid(siteId)) notFound();
  let site;
  try {
    site = await getOwnedSite(user.id, siteId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (site.template_key !== "lovestory") redirect(`/preview/${site.id}`);
  const parsed = draftContentSchema.safeParse(site.draft_content);
  const content = parsed.success ? parsed.data : newSiteContent();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <LovePreviewClient initialContent={content} initialMedia={await signMedia(site.id, referencedAssets(content))} start={typeof at === "string" ? at.slice(0, 40) : null} today={today} />;
}
