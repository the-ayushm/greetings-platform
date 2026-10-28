"use client";

import { useEffect, useState } from "react";
import { LoveExperience, type MediaMap } from "@/templates/lovestory/Experience";
import { draftContentSchema, type LoveContent } from "@/templates/lovestory/schema";

/**
 * Receives live content from the studio (parent window, same origin only) and renders it with
 * the real template. Incoming content is re-validated; anything malformed is ignored.
 * `lu:goto` messages jump to the section the customer is editing.
 */
export function LovePreviewClient({ initialContent, initialMedia, start, today }: { initialContent: LoveContent; initialMedia: MediaMap; start: string | null; today: string }) {
  const [content, setContent] = useState(initialContent);
  const [media, setMedia] = useState(initialMedia);
  const [jump, setJump] = useState({ target: start, nonce: 0 });

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const d = e.data as { type?: string; content?: unknown; media?: MediaMap; target?: unknown };
      if (d?.type === "bday:content") {
        const parsed = draftContentSchema.safeParse(d.content);
        if (parsed.success) setContent(parsed.data);
        if (d.media && typeof d.media === "object") setMedia({ images: { ...d.media.images }, audio: { ...d.media.audio } });
      }
      if (d?.type === "lu:goto" && typeof d.target === "string") setJump((j) => ({ target: String(d.target).slice(0, 40), nonce: j.nonce + 1 }));
    };
    addEventListener("message", onMsg);
    if (window.parent !== window) window.parent.postMessage({ type: "bday:ready" }, window.location.origin);
    return () => removeEventListener("message", onMsg);
  }, []);

  return <LoveExperience content={content} mode="preview" media={media} storageKey="preview" start={jump} today={today} />;
}
