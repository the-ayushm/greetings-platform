"use client";

import { useEffect, useState } from "react";
import { AskExperience, type MediaMap } from "@/templates/doyouloveme/Experience";
import { draftContentSchema, type AskContent } from "@/templates/doyouloveme/schema";

/**
 * Receives live content from the studio (parent window, same origin only) and renders it with
 * the real template. Incoming content is re-validated; anything malformed is ignored.
 * `dy:goto` messages switch to the screen the customer is editing (ask / takeover / finale).
 */
export function AskPreviewClient({ initialContent, initialMedia, start }: { initialContent: AskContent; initialMedia: MediaMap; start: string | null }) {
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
      if (d?.type === "dy:goto" && typeof d.target === "string") setJump((j) => ({ target: String(d.target).slice(0, 20), nonce: j.nonce + 1 }));
    };
    addEventListener("message", onMsg);
    if (window.parent !== window) window.parent.postMessage({ type: "bday:ready" }, window.location.origin);
    return () => removeEventListener("message", onMsg);
  }, []);

  return <AskExperience content={content} mode="preview" media={media} start={jump} />;
}
