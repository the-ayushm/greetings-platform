import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, PageShell, formatDate, formatDateTime } from "@/components/ui";
import { requireUserPage } from "@/server/auth";
import { ApiError, isUuid } from "@/server/http";
import { getOwnedSite, siteUrl } from "@/server/sites";
import { SiteManager } from "./SiteManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Share & settings" };

export default async function SitePage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const user = await requireUserPage(`/dashboard/sites/${siteId}`);
  if (!isUuid(siteId)) notFound();
  let site;
  try {
    site = await getOwnedSite(user.id, siteId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const c = site.draft_content as { recipientName?: string };
  const editable = ["draft", "published", "unpublished"].includes(site.status) && new Date(site.edit_until) > new Date();
  return (
    <PageShell narrow>
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold break-words">For {c.recipientName?.trim() || "someone special"} ♡</h1>
        <Badge tone={site.status === "published" ? "good" : site.status === "draft" ? "warn" : "neutral"}>{site.status}</Badge>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Editable until {formatDate(site.edit_until)} · live until {formatDate(site.expires_at)} ·{" "}
        {site.first_viewed_at ? `opened ${site.view_count}× (first ${formatDateTime(site.first_viewed_at)})` : "not opened yet"}
      </p>
      {editable && (
        <ButtonLink href={`/dashboard/sites/${site.id}/edit`} className="mt-5 w-full">
          Open the editor
        </ButtonLink>
      )}
      <SiteManager
        siteId={site.id}
        status={site.status}
        url={site.slug ? siteUrl(site.slug) : null}
        hasPasscode={Boolean(site.passcode_hash)}
        editable={editable}
        disabledReason={site.disabled_reason}
      />
    </PageShell>
  );
}
