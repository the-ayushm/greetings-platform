"use client";

import { createContext, useContext } from "react";
import type { ScrapbookContent } from "./schema";
import type { Timers } from "./engine/effects";

export type SceneId = "cover" | "quiz" | "menu" | "letter" | "memories" | "coupons" | "song" | "surprise" | "final";

/** live = recipient's page · preview = owner's editor iframe · demo = public sample */
export type RenderMode = "live" | "preview" | "demo";

export type ResolvedImage = { src: string; srcSet?: string };

export type LiftState = { type: "photo"; i: number } | { type: "coupon"; i: number } | null;

export type ExperienceCtx = {
  c: ScrapbookContent;
  mode: RenderMode;
  fill: (s: string, extra?: Record<string, string | number>) => string;
  image: (assetId: string) => ResolvedImage | null;
  reportMediaError: (assetId: string) => void;
  reduced: () => boolean;
  timers: Timers;
  popAt: (el: Element | null, n?: number) => void;
  confetti: (n?: number, ox?: number, oy?: number) => void;
  riseHearts: (n: number) => void;
  appEl: () => HTMLElement | null;
  sceneEl: (id: SceneId) => HTMLElement | null;
  go: (id: SceneId) => void;
  lift: LiftState;
  setLift: (l: LiftState) => void;
  opened: Set<string>;
  markOpened: (card: string) => void;
  usedCoupons: Set<number>;
  toggleCoupon: (i: number) => void;
};

export const Ctx = createContext<ExperienceCtx | null>(null);

export function useExperience(): ExperienceCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useExperience outside <Experience>");
  return v;
}

/** Replace {name} {sender} {pet} (and scene-specific tokens) in plain text. Output is text, not HTML. */
export function makeFill(c: ScrapbookContent) {
  return (s: string, extra?: Record<string, string | number>) => {
    let out = String(s ?? "")
      .replace(/\{name\}/g, c.recipientName)
      .replace(/\{sender\}/g, c.senderName)
      .replace(/\{pet\}/g, c.petName);
    if (extra) for (const k in extra) out = out.split(`{${k}}`).join(String(extra[k]));
    return out;
  };
}

/** Unicode-aware version of the legacy "www.for-<name>.love" address pill. */
export function addressSlug(name: string): string {
  const s = name
    .toLocaleLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return s || "you";
}
