"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WeddingInvitation, type MediaMap, type SendRsvp } from "@/templates/wedding/Invitation";
import type { WeddingContent } from "@/templates/wedding/schema";
import { pingView, ReportLink } from "../../../(renderer)/ReportLink";

/** The guest's invitation: the experience plus view ping, media refresh, RSVPs and report. */
export function WeddingLivePage({ slug, content, media: initialMedia }: { slug: string; content: WeddingContent; media: MediaMap }) {
  const [media, setMedia] = useState(initialMedia);
  const refreshing = useRef<Promise<void> | null>(null);
  const lastRefresh = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => pingView(slug), 3000);
    return () => clearTimeout(t);
  }, [slug]);

  /** Signed media URLs expire after 2 hours; fetch fresh ones once when something fails to load. */
  const onMediaError = useCallback(() => {
    if (refreshing.current || Date.now() - lastRefresh.current < 60_000) return;
    lastRefresh.current = Date.now();
    refreshing.current = fetch("/api/r/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) })
      .then((r) => (r.ok ? (r.json() as Promise<MediaMap>) : null))
      .then((m) => {
        if (m) setMedia(m);
      })
      .catch(() => undefined)
      .finally(() => {
        refreshing.current = null;
      });
  }, [slug]);

  const sendRsvp: SendRsvp = useCallback(
    async ({ website, ...reply }) => {
      const r = await fetch("/api/r/rsvp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, reply, website }) }).catch(() => null);
      if (!r) return { ok: false, message: "You seem to be offline. Please check your connection and try again." };
      if (r.ok) return { ok: true };
      if (r.status === 429) return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
      const body = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
      return { ok: false, message: body?.error?.message ?? "Your reply couldn't be sent. Please try again." };
    },
    [slug],
  );

  return (
    <>
      <WeddingInvitation content={content} mode="live" media={media} storageKey={slug} onMediaError={onMediaError} sendRsvp={sendRsvp} />
      <ReportLink slug={slug} />
    </>
  );
}
