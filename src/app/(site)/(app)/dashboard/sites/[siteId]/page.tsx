import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, PageShell, formatDate, formatDateTime } from "@/components/ui";
import { userDb } from "@/lib/supabase/server";
import { requireUserPage } from "@/server/auth";
import { ApiError, isUuid } from "@/server/http";
import { getOwnedSite, siteUrl } from "@/server/sites";
import { templateDef } from "@/templates/registry";
import { ResponsesPanel } from "./ResponsesPanel";
import { RsvpPanel } from "./RsvpPanel";
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
  const def = templateDef(site.template_key);
  const love = site.template_key === "lovestory";
  const wedding = site.template_key === "wedding";
  const name = def.recipientName(site.draft_content);
  const editable = ["draft", "published", "unpublished"].includes(site.status) && new Date(site.edit_until) > new Date();
  // Recipient responses (love story only): owner-only through RLS.
  const responses = love
    ? ((await (await userDb()).from("site_responses").select("id, kind, label, value, created_at").eq("site_id", site.id).order("created_at", { ascending: false }).limit(200)).data ?? [])
    : [];
  // Wedding RSVPs: owner-only through RLS.
  const rsvps = wedding
    ? ((await (await userDb()).from("site_rsvps").select("id, guest_name, attending, guests, message, created_at").eq("site_id", site.id).order("created_at", { ascending: false }).limit(1000)).data ?? [])
    : [];
  return (
    <PageShell narrow>
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold break-words">{wedding ? `${name || "Your"} wedding invitation` : `For ${name || "someone special"} ♡`}</h1>
        <Badge tone={site.status === "published" ? "good" : site.status === "draft" ? "warn" : "neutral"}>{site.status}</Badge>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Editable until {formatDate(site.edit_until)} · live until {formatDate(site.expires_at)} ·{" "}
        {site.first_viewed_at ? `opened ${site.view_count}× (first ${formatDateTime(site.first_viewed_at)})` : "not opened yet"}
      </p>
      {editable && (
        <ButtonLink href={`/dashboard/sites/${site.id}/edit`} className="mt-5 w-full">
          {love || wedding ? "Open the customization studio" : "Open the editor"}
        </ButtonLink>
      )}
      <SiteManager
        siteId={site.id}
        status={site.status}
        url={site.slug ? siteUrl(site.slug, site.template_key) : null}
        hasPasscode={Boolean(site.passcode_hash)}
        editable={editable}
        disabledReason={site.disabled_reason}
        shareText={def.shareText}
        kindLabel={love ? "love story" : wedding ? "wedding invitation" : "birthday site"}
        qrFile={love ? "love-story-qr.png" : wedding ? "wedding-invitation-qr.png" : "birthday-qr.png"}
      />
      {love && <ResponsesPanel siteId={site.id} responses={responses} />}
      {wedding && <RsvpPanel siteId={site.id} rsvps={rsvps} />}
    </PageShell>
  );
}
