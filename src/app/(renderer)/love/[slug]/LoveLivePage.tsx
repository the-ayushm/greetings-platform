"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoveExperience, type MediaMap } from "@/templates/lovestory/Experience";
import type { LoveContent } from "@/templates/lovestory/schema";
import { pingView, ReportLink } from "../../ReportLink";

/** The recipient's love story: the experience plus view ping, media refresh, responses and report. */
export function LoveLivePage({ slug, content, media: initialMedia, today }: { slug: string; content: LoveContent; media: MediaMap; today: string }) {
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

  const onRespond = useCallback(
    async (kind: "text" | "slider" | "coupon", itemId: string, value: string) => {
      const r = await fetch("/api/r/respond", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, kind, itemId, value }) }).catch(() => null);
      if (!r?.ok) return "failed" as const;
      const body = (await r.json().catch(() => null)) as { stored?: boolean } | null;
      return body?.stored ? ("stored" as const) : ("off" as const);
    },
    [slug],
  );

  return (
    <>
      <LoveExperience content={content} mode="live" media={media} storageKey={slug} onMediaError={onMediaError} onRespond={onRespond} today={today} />
      <ReportLink slug={slug} />
    </>
  );
}
