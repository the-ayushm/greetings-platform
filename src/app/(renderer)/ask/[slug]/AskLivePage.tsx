"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AskExperience, type MediaMap } from "@/templates/doyouloveme/Experience";
import type { AskContent } from "@/templates/doyouloveme/schema";
import { pingView, ReportLink } from "../../ReportLink";

/** The partner's page: the experience plus view ping, media refresh, the Yes notification and report. */
export function AskLivePage({ slug, content, media: initialMedia }: { slug: string; content: AskContent; media: MediaMap }) {
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

  /** Fire-and-forget: the celebration never waits on (or fails because of) the network. */
  const onAnswer = useCallback(
    (noCount: number) => {
      void fetch("/api/r/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, kind: "answer", itemId: "answer", value: String(noCount) }),
        keepalive: true,
      }).catch(() => undefined);
    },
    [slug],
  );

  return (
    <>
      <AskExperience content={content} mode="live" media={media} onMediaError={onMediaError} onAnswer={onAnswer} />
      <ReportLink slug={slug} />
    </>
  );
}
