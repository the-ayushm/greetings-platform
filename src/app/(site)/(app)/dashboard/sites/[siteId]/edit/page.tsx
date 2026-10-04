import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUserPage } from "@/server/auth";
import { ApiError, isUuid } from "@/server/http";
import { getOwnedSite, siteUrl } from "@/server/sites";
import { newSiteContent } from "@/templates/scrapbook/defaults";
import { draftContentSchema } from "@/templates/scrapbook/schema";
import { Editor } from "./Editor";

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
  const parsed = draftContentSchema.safeParse(site.draft_content);
  return (
    <Editor
      siteId={site.id}
      initial={parsed.success ? parsed.data : newSiteContent()}
      initialRevision={site.draft_revision}
      status={site.status}
      publishedUrl={site.slug ? siteUrl(site.slug) : null}
    />
  );
}
