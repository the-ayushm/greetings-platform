import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUserPage } from "@/server/auth";
import { appOrigin } from "@/server/env";
import { ApiError, isUuid } from "@/server/http";
import { getOwnedSite, signMedia } from "@/server/sites";
import { templateDef } from "@/templates/registry";
import { newSiteContent } from "@/templates/vivah/defaults";
import { draftContentSchema, referencedAssets } from "@/templates/vivah/schema";
import { VivahPreviewClient } from "./VivahPreviewClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Owner-only preview of a Shiv–Parvati invitation DRAFT, embedded by the studio (same origin, never the public renderer). */
export default async function VivahPreviewPage({ params, searchParams }: { params: Promise<{ siteId: string }>; searchParams: Promise<{ at?: string }> }) {
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
  if (site.template_key !== "vivah") redirect(templateDef(site.template_key).previewPath(site.id));
  const parsed = draftContentSchema.safeParse(site.draft_content);
  const content = parsed.success ? parsed.data : newSiteContent();
  return <VivahPreviewClient initialContent={content} initialMedia={await signMedia(site.id, referencedAssets(content))} brandHref={appOrigin()} start={typeof at === "string" ? at.slice(0, 40) : null} />;
}
