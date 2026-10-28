"use client";

import { createContext, useContext } from "react";
import type { RsvpInput, WeddingContent } from "./schema";

/** live = guest's page · preview = owner's studio iframe · demo = public sample */
export type RenderMode = "live" | "preview" | "demo";

export type ResolvedImage = { src: string; srcSet?: string };
export type MediaMap = { images: Record<string, ResolvedImage>; audio: Record<string, { src: string }> };

/** Outcome of sending an RSVP from the live page. */
export type RsvpResult = { ok: true } | { ok: false; message: string };
export type SendRsvp = (r: RsvpInput & { website: string }) => Promise<RsvpResult>;

export type WeddingCtx = {
  c: WeddingContent;
  mode: RenderMode;
  /** Replaces {bride}, {groom} and {date} in customer text. */
  fill: (s: string) => string;
  image: (assetId: string | undefined | null) => ResolvedImage | null;
  reportMediaError: (assetId: string) => void;
  /** True when the guest prefers reduced motion. */
  still: boolean;
  storageKey: string;
  sendRsvp?: SendRsvp;
  reopenEnvelope: () => void;
};

export const Ctx = createContext<WeddingCtx | null>(null);

export function useWedding(): WeddingCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWedding outside <WeddingInvitation>");
  return v;
}

/** Browser storage that never throws (private mode, blocked storage, old WebViews). */
export const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* not available — the page works without it */
    }
  },
};
