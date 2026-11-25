"use client";

import { useEffect, useMemo, useState } from "react";
import { toInviteData, type MediaMap } from "@/templates/vivah/adapter";
import { draftContentSchema, type VivahContent } from "@/templates/vivah/schema";
import { VivahStage } from "@/templates/vivah/Stage";

/**
 * Receives live content from the studio (parent window, same origin only) and renders it with
 * the real template. Incoming content is re-validated; anything malformed is ignored. Edits are
 * applied after a short pause so typing doesn't rebuild the invitation on every key.
 * `wd:goto` messages scroll to the section the customer is editing.
 */
export function VivahPreviewClient({ initialContent, initialMedia, brandHref, start }: { initialContent: VivahContent; initialMedia: MediaMap; brandHref: string; start: string | null }) {
  const [content, setContent] = useState(initialContent);
  const [media, setMedia] = useState(initialMedia);
  const [jump, setJump] = useState({ target: start, nonce: 0 });

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const d = e.data as { type?: string; content?: unknown; media?: MediaMap; target?: unknown };
      if (d?.type === "bday:content") {
        const parsed = draftContentSchema.safeParse(d.content);
        const m = d.media && typeof d.media === "object" ? { images: { ...d.media.images }, audio: { ...d.media.audio } } : null;
        clearTimeout(t);
        t = setTimeout(() => {
          if (parsed.success) setContent((prev) => (JSON.stringify(prev) === JSON.stringify(parsed.data) ? prev : parsed.data));
          if (m) setMedia((prev) => (JSON.stringify(prev) === JSON.stringify(m) ? prev : m));
        }, 450);
      }
      if (d?.type === "wd:goto" && typeof d.target === "string") setJump((j) => ({ target: String(d.target).slice(0, 40), nonce: j.nonce + 1 }));
    };
    addEventListener("message", onMsg);
    if (window.parent !== window) window.parent.postMessage({ type: "bday:ready" }, window.location.origin);
    return () => {
      clearTimeout(t);
      removeEventListener("message", onMsg);
    };
  }, []);

  const { data, strings } = useMemo(() => toInviteData(content, media, { brandHref, demo: true }), [content, media, brandHref]);
  // Inside the studio the invitation starts open (no tap-to-open, no autoplay); full screen shows the real opening.
  const [embedded] = useState(() => typeof window !== "undefined" && window.parent !== window);
  return <VivahStage data={data} strings={strings} demo autoOpen={embedded} jump={jump} />;
}
