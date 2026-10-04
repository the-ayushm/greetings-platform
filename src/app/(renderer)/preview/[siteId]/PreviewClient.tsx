"use client";

import { useEffect, useState } from "react";
import { Experience, type MediaMap } from "@/templates/scrapbook/Experience";
import { draftContentSchema, type ScrapbookContent } from "@/templates/scrapbook/schema";

/**
 * Receives live content from the editor (parent window, same origin only) and renders it with
 * the real template. Incoming content is re-validated; anything malformed is ignored.
 */
export function PreviewClient({ initialContent, initialMedia }: { initialContent: ScrapbookContent; initialMedia: MediaMap }) {
  const [content, setContent] = useState(initialContent);
  const [media, setMedia] = useState(initialMedia);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const d = e.data as { type?: string; content?: unknown; media?: MediaMap };
      if (d?.type !== "bday:content") return;
      const parsed = draftContentSchema.safeParse(d.content);
      if (parsed.success) setContent(parsed.data);
      if (d.media && typeof d.media === "object") setMedia({ images: { ...d.media.images }, audio: { ...d.media.audio } });
    };
    addEventListener("message", onMsg);
    if (window.parent !== window) window.parent.postMessage({ type: "bday:ready" }, window.location.origin);
    return () => removeEventListener("message", onMsg);
  }, []);

  return <Experience content={content} mode="preview" media={media} storageKey="preview" />;
}
