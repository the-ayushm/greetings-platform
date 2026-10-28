"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Experience, type MediaMap } from "@/templates/scrapbook/Experience";
import type { ScrapbookContent } from "@/templates/scrapbook/schema";
import { pingView, ReportLink } from "../../ReportLink";

/** The recipient's page: the experience, plus quiet plumbing (view ping, media refresh, report). */
export function LivePage({ slug, siteId, content, media: initialMedia }: { slug: string; siteId: string; content: ScrapbookContent; media: MediaMap }) {
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

  return (
    <>
      <Experience content={content} mode="live" media={media} storageKey={siteId} onMediaError={onMediaError} />
      <ReportLink slug={slug} />
    </>
  );
}
