import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUserPage } from "@/server/auth";
import { ApiError, isUuid } from "@/server/http";
import { getOwnedSite, siteUrl } from "@/server/sites";
import { newSiteContent as newLoveStory } from "@/templates/lovestory/defaults";
import { draftContentSchema as loveDraftSchema } from "@/templates/lovestory/schema";
import { newSiteContent } from "@/templates/scrapbook/defaults";
import { draftContentSchema } from "@/templates/scrapbook/schema";
import { Editor } from "./Editor";
import { LoveStudio } from "./love/LoveStudio";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit your site" };

export default async function EditPage({ params }: { params: Promise<{ siteId: string }> }) {
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
  const editable = ["draft", "published", "unpublished"].includes(site.status) && new Date(site.edit_until) > new Date();
  if (!editable) redirect(`/dashboard/sites/${siteId}`);
  const publishedUrl = site.slug ? siteUrl(site.slug, site.template_key) : null;

  if (site.template_key === "lovestory") {
    const parsed = loveDraftSchema.safeParse(site.draft_content);
    return (
      <LoveStudio
        siteId={site.id}
        initial={parsed.success ? parsed.data : newLoveStory()}
        initialRevision={site.draft_revision}
        status={site.status}
        publishedUrl={publishedUrl}
        editUntil={site.edit_until}
      />
    );
  }

  const parsed = draftContentSchema.safeParse(site.draft_content);
  return (
    <Editor
      siteId={site.id}
      initial={parsed.success ? parsed.data : newSiteContent()}
      initialRevision={site.draft_revision}
      status={site.status}
      publishedUrl={publishedUrl}
    />
  );
}
