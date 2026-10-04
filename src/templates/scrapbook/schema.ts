import { z } from "zod";

/**
 * Content schema for the scrapbook template — the validated replacement for the legacy
 * `birthdayConfig` object. Two variants are built from one definition:
 *   - draft:   every max-length/shape rule, but required fields may be empty (autosave).
 *   - publish: everything a recipient needs is present (Publish button).
 * Customer text is plain text only. It is rendered through JSX text nodes, never as HTML.
 */

export const SCHEMA_VERSION = 1 as const;

// C0/C1 control characters (keeps \n and \t), bidi embedding/override/isolate controls
// (spoofing), BOM. Everything else in Unicode — Devanagari, emoji, RTL scripts — is allowed.
const STRIP = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‪-‮⁦-⁩﻿]/g;

export function cleanText(value: string, multiline = false): string {
  let v = value.normalize("NFC").replace(STRIP, "");
  v = multiline ? v.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n") : v.replace(/\s+/g, " ");
  return v.trim();
}

const HEX = /^#[0-9a-f]{6}$/i;

function factory(strict: boolean) {
  const text = (max: number, required = false, multiline = false) =>
    z
      .string()
      .max(max * 4) // hard cap before normalisation work
      .transform((v) => cleanText(v, multiline))
      .pipe(strict && required ? z.string().min(1, "Required").max(max) : z.string().max(max));

  const mediaRef = z.object({ assetId: z.uuid() }).nullable();
  const hex = z.string().regex(HEX, "Use a colour like #f59ab8").transform((v) => v.toLowerCase());

  return z.object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    recipientName: text(40, true),
    senderName: text(40, true),
    petName: text(30),
    birthdayDate: text(12),
    photoDateStamp: text(16),

    cover: z.object({
      titleTop: text(40),
      handwritten: text(90),
      photo: mediaRef,
      photoCaption: text(40),
      button: text(32, true),
    }),

    questions: z
      .array(
        z.object({
          q: text(120, true),
          options: z.tuple([text(24, true), text(24, true)]),
          replies: z.tuple([text(60), text(60)]),
        }),
      )
      .min(1)
      .max(5),
    startLine: z.tuple([text(30), text(30)]),
    startButton: text(16, true),

    menuTitle: text(40),
    menuNote: text(90),
    cards: z.object({
      letter: text(20, true),
      memories: text(20, true),
      coupons: text(20, true),
      song: text(20, true),
      gift: text(20, true),
    }),

    letter: z.object({
      envelopeLabel: text(20),
      greeting: text(80),
      body: z.array(text(700, true, true)).min(1).max(6),
      closing: text(240),
      signoff: text(30),
    }),

    memoriesTitle: text(40),
    memories: z
      .array(z.object({ image: mediaRef, caption: text(40) }))
      .min(1)
      .max(12),

    couponsTitle: text(40),
    couponsNote: text(90),
    coupons: z
      .array(z.object({ title: text(28, true), message: text(160) }))
      .min(1)
      .max(8),

    reasonsTitle: text(50),
    reasons: z.array(text(60, true)).min(1).max(8),

    song: z.object({
      title: text(50),
      artist: text(50),
      audio: mediaRef,
      cover: mediaRef,
    }),

    surprise: z.object({
      titleTop: text(40),
      small: text(90),
      hint: text(40),
      afterTap: text(60),
      next: text(32, true),
      photos: z.tuple([mediaRef, mediaRef]),
      captions: z.tuple([text(20), text(20)]),
    }),

    final: z.object({
      wait: z.array(text(30, true)).min(1).max(3),
      heading: text(60),
      finalMessage: text(240),
      photo: mediaRef,
      photoCaption: text(40),
      lines: z.array(text(60, true)).max(6),
      restart: text(24, true),
    }),

    theme: z.object({
      pink: hex,
      blush: hex,
      baby: hex,
      cream: hex,
      lavender: hex,
      red: hex,
      ink: hex,
    }),

    /** Small UI phrases that were hardcoded in the legacy renderer. */
    copy: z.object({
      back: text(20, true),
      opened: text(16),
      openedCount: text(40),
      questionOf: text(40),
      readyBar: text(20),
      tapEnvelope: text(40),
      memoriesNote: text(60),
      putBack: text(24, true),
      couponGoodFor: text(40),
      couponNo: text(40),
      finePrint: text(30),
      couponFrom: text(60),
      useIt: text(20, true),
      unuseIt: text(20, true),
      backToCoupons: text(20, true),
      usedStamp: text(12),
      nowPlaying: text(24),
      pressPlay: text(60),
      playingSong: text(80),
      playingMusicBox: text(80),
      audioError: text(80),
    }),
  });
}

export const draftContentSchema = factory(false);
export const publishContentSchema = factory(true);

export type ScrapbookContent = z.output<typeof publishContentSchema>;
export type MediaRef = ScrapbookContent["cover"]["photo"];

/** Every asset id referenced by a piece of content, with the kind it must be. */
export function referencedAssets(c: ScrapbookContent): { id: string; kind: "image" | "audio" }[] {
  const imgs = [
    c.cover.photo,
    c.song.cover,
    c.final.photo,
    ...c.surprise.photos,
    ...c.memories.map((m) => m.image),
  ];
  const out: { id: string; kind: "image" | "audio" }[] = [];
  for (const r of imgs) if (r) out.push({ id: r.assetId, kind: "image" });
  if (c.song.audio) out.push({ id: c.song.audio.assetId, kind: "audio" });
  return out;
}

export const THEME_PRESETS: Record<string, { label: string; theme: ScrapbookContent["theme"] }> = {
  classic: {
    label: "Classic pink",
    theme: { pink: "#f59ab8", blush: "#fbcfdd", baby: "#ffe8ef", cream: "#fff8ec", lavender: "#dccbf7", red: "#d2475f", ink: "#6a3346" },
  },
  lavender: {
    label: "Lavender dream",
    theme: { pink: "#c3a6f0", blush: "#e3d4fb", baby: "#f3ecff", cream: "#fdf9ff", lavender: "#f7c6dc", red: "#8e4fc7", ink: "#4b3366" },
  },
  peach: {
    label: "Peach sorbet",
    theme: { pink: "#f7a98b", blush: "#fcd3c1", baby: "#fff0e8", cream: "#fffaf3", lavender: "#d6e4f5", red: "#d65a3c", ink: "#6b3a2e" },
  },
};
