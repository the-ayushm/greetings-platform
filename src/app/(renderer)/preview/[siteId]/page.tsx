import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserPage } from "@/server/auth";
import { ApiError, isUuid } from "@/server/http";
import { getOwnedSite, signMedia } from "@/server/sites";
import { newSiteContent } from "@/templates/scrapbook/defaults";
import { draftContentSchema } from "@/templates/scrapbook/schema";
import { PreviewClient } from "./PreviewClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Owner-only preview of the DRAFT, embedded by the editor (same origin, never the public renderer). */
export default async function PreviewPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const user = await requireUserPage(`/dashboard/sites/${siteId}/edit`);
  if (!isUuid(siteId)) notFound();
  let site;
  try {
    site = await getOwnedSite(user.id, siteId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const parsed = draftContentSchema.safeParse(site.draft_content);
  const content = parsed.success ? parsed.data : newSiteContent();
  return <PreviewClient initialContent={content} initialMedia={await signMedia(site.id, content)} />;
}
