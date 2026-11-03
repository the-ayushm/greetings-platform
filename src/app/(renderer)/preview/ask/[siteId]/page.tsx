import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUserPage } from "@/server/auth";
import { ApiError, isUuid } from "@/server/http";
import { getOwnedSite, signMedia } from "@/server/sites";
import { newSiteContent } from "@/templates/doyouloveme/defaults";
import { draftContentSchema, referencedAssets } from "@/templates/doyouloveme/schema";
import { templateDef } from "@/templates/registry";
import { AskPreviewClient } from "./AskPreviewClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Owner-only preview of a "Do You Love Me?" DRAFT, embedded by the studio (same origin, never the public renderer). */
export default async function AskPreviewPage({ params, searchParams }: { params: Promise<{ siteId: string }>; searchParams: Promise<{ at?: string }> }) {
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
  if (site.template_key !== "doyouloveme") redirect(templateDef(site.template_key).previewPath(site.id));
  const parsed = draftContentSchema.safeParse(site.draft_content);
  const content = parsed.success ? parsed.data : newSiteContent();
  return <AskPreviewClient initialContent={content} initialMedia={await signMedia(site.id, referencedAssets(content))} start={typeof at === "string" ? at.slice(0, 20) : null} />;
}
