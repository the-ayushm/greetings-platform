"use client";

import { createContext, useContext } from "react";
import type { LoveContent, SectionId } from "./schema";

/** live = recipient's page · preview = owner's studio iframe · demo = public sample */
export type RenderMode = "live" | "preview" | "demo";

export type ResolvedImage = { src: string; srcSet?: string };
export type MediaMap = { images: Record<string, ResolvedImage>; audio: Record<string, { src: string }> };

export type StepKind = "welcome" | "question" | Exclude<SectionId, "quiz"> | "final";
export type Step = { kind: StepKind; key: string; question?: number };

/** Result of sending a recipient response. "off" = the creator didn't switch collection on. */
export type RespondResult = "stored" | "off" | "failed" | "preview";
export type Respond = (kind: "text" | "slider" | "coupon", itemId: string, value: string) => Promise<RespondResult>;

export type LoveCtx = {
  c: LoveContent;
  mode: RenderMode;
  fill: (s: string) => string;
  image: (assetId: string | undefined | null) => ResolvedImage | null;
  reportMediaError: (assetId: string) => void;
  /** True when motion is off (customer setting or the visitor's reduced-motion preference). */
  still: boolean;
  next: () => void;
  back: () => void;
  restart: () => void;
  stepIndex: number;
  stepCount: number;
  /** Heart burst at an element (no-op when still). */
  burst: (el: Element | null, n?: number) => void;
  respond: Respond;
  startMusic: () => void;
  storageKey: string;
};

export const Ctx = createContext<LoveCtx | null>(null);

export function useLove(): LoveCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLove outside <LoveExperience>");
  return v;
}

/** Ordered steps for the enabled sections: welcome → … → final. Each question is its own step. */
export function buildSteps(c: LoveContent): Step[] {
  const out: Step[] = [{ kind: "welcome", key: "welcome" }];
  for (const s of c.sections) {
    if (!s.enabled) continue;
    if (s.id === "quiz") c.quiz.questions.forEach((q, i) => out.push({ kind: "question", key: `q:${q.id}`, question: i }));
    else out.push({ kind: s.id, key: s.id });
  }
  out.push({ kind: "final", key: "final" });
  return out;
}

/** Which step a studio panel / demo link should jump to. */
export function stepForTarget(steps: Step[], target: string | null | undefined): number {
  if (!target) return 0;
  const i = steps.findIndex((s) => s.kind === target || s.key === target || (target === "quiz" && s.kind === "question"));
  return i < 0 ? 0 : i;
}
