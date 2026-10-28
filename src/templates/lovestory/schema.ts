import { z } from "zod";
import { cleanText } from "@/templates/scrapbook/schema";

/**
 * Content schema for "Our Little Universe" (template key `lovestory`). Same rules as the
 * scrapbook template: plain text only (rendered through JSX), a draft variant for autosave
 * and a strict variant for Publish. The letter allows a tiny safe markup (**bold**, *italic*,
 * "- " bullets) that is parsed into React nodes — never HTML.
 */

export const SCHEMA_VERSION = 1 as const;

/** Sections between the welcome page and the final surprise, in the customer's chosen order. */
export const SECTION_IDS = ["quiz", "unlock", "timeline", "scrapbook", "calendar", "letter", "coupons", "photowall"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const RELATIONSHIPS = ["girlfriend", "boyfriend", "partner", "wife", "husband", "fiance", "crush"] as const;
export const OCCASIONS = ["birthday", "anniversary", "valentines", "proposal", "milestone", "just-because"] as const;
export const COUPON_COLORS = ["pink", "peach", "sky", "lilac", "mint", "butter"] as const;
export const COUPON_ICONS = ["hug", "movie", "sun", "treat", "cuddle", "gift", "dinner", "travel", "music", "star"] as const;
export const PRESETS = ["cherry", "pink", "midnight", "vintage", "pastel", "custom"] as const;
export const FONT_PAIRS = ["romantic", "classic", "playful", "storybook"] as const;
export const BORDERS = ["ribbon", "lace", "simple", "none"] as const;
export const BACKDROPS = ["night", "paper", "gradient", "plain"] as const;
export const MOTION = ["off", "subtle", "lively"] as const;
export const FINAL_HEARTS = ["glow", "pulse", "burst"] as const;
export const MUSIC_MODES = ["none", "file", "musicbox"] as const;

const HEX = /^#[0-9a-f]{6}$/i;
const ID = /^[a-z0-9]{4,16}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(v: string) {
  if (!ISO_DATE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && y <= 2200 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function factory(strict: boolean) {
  const text = (max: number, required = false, multiline = false) =>
    z
      .string()
      .max(max * 4)
      .transform((v) => cleanText(v, multiline))
      .pipe(strict && required ? z.string().min(1, "Required").max(max) : z.string().max(max));

  const id = z.string().regex(ID, "Invalid id");
  const mediaRef = z.object({ assetId: z.uuid() }).nullable();
  const hex = z.string().regex(HEX, "Use a colour like #c2185b").transform((v) => v.toLowerCase());
  /** "" (not set yet) or a real calendar date. */
  const optDate = z.string().refine((v) => v === "" || isValidIsoDate(v), "Use a valid date");
  const reqDate = strict ? z.string().refine(isValidIsoDate, "Pick a date") : optDate;

  const choiceQ = z.object({
    id,
    type: z.literal("choice"),
    prompt: text(140, true),
    options: z.array(z.object({ label: text(60, true) })).min(2).max(5),
    /** Index of the right answer; null = every answer is a good answer. */
    correct: z.number().int().min(0).max(4).nullable(),
    note: text(160),
    photo: mediaRef,
    wrongMessage: text(200),
  });
  const imageQ = z.object({
    id,
    type: z.literal("image"),
    prompt: text(140, true),
    options: z.array(z.object({ label: text(60, true), image: mediaRef })).min(2).max(6),
    correct: z.number().int().min(0).max(5).nullable(),
    note: text(160),
    wrongMessage: text(200),
  });
  const sliderQ = z.object({
    id,
    type: z.literal("slider"),
    prompt: text(140, true),
    labels: z.tuple([text(30), text(30), text(30)]),
    /** Replies shown for the low / middle / high third of the slider. */
    replies: z.tuple([text(140), text(140), text(140)]),
    note: text(160),
  });
  const textQ = z.object({
    id,
    type: z.literal("text"),
    prompt: text(140, true),
    placeholder: text(60),
    note: text(160),
  });

  const photoItem = z.object({ id, image: mediaRef, caption: text(60), date: optDate, category: z.string().max(16) });

  return z
    .object({
      schemaVersion: z.literal(SCHEMA_VERSION),
      people: z.object({
        creatorName: text(40, true),
        partnerName: text(40, true),
        petName: text(30),
        relationship: z.enum(RELATIONSHIPS),
        occasion: z.enum(OCCASIONS),
        startDate: optDate,
        firstMetDate: optDate,
      }),
      sections: z
        .array(z.object({ id: z.enum(SECTION_IDS), enabled: z.boolean() }))
        .length(SECTION_IDS.length)
        .refine((s) => new Set(s.map((x) => x.id)).size === SECTION_IDS.length, "Each section must appear once"),

      welcome: z.object({
        greeting: text(60, true),
        intro: text(300, false, true),
        button: text(28, true),
        note: text(80, false, true),
        photo: mediaRef,
      }),
      music: z.object({
        mode: z.enum(MUSIC_MODES),
        title: text(60),
        artist: text(60),
        audio: mediaRef,
      }),
      quiz: z.object({
        questions: z.discriminatedUnion("type", [choiceQ, imageQ, sliderQ, textQ]).array().min(1).max(10),
        correctReply: text(80),
        wrong: z.object({
          title: text(40, true),
          message: text(200, false, true),
          bubble: text(240, false, true),
          button: text(24, true),
        }),
      }),
      unlock: z.object({
        title: text(40, true),
        message: text(200, false, true),
        button: text(28, true),
        photo: mediaRef,
      }),
      timeline: z.object({
        title: text(40, true),
        subtitle: text(90),
        events: z
          .array(z.object({ id, date: optDate, title: text(50, true), description: text(240, false, true), photo: mediaRef }))
          .min(1)
          .max(12),
      }),
      scrapbook: z.object({
        title: text(40, true),
        subtitle: text(90),
        categories: z.array(z.object({ id, label: text(24, true) })).max(6),
        photos: z.array(photoItem).min(1).max(30),
        note: text(80, false, true),
      }),
      calendar: z.object({
        title: text(40, true),
        listTitle: text(40),
        dates: z
          .array(z.object({ id, date: reqDate, label: text(40, true), repeatsYearly: z.boolean() }))
          .min(1)
          .max(20),
      }),
      letter: z.object({
        heading: text(60, true),
        tabs: z.array(z.object({ id, label: text(24, true), body: text(2500, true, true) })).min(1).max(8),
        signoff: text(40),
        signature: text(40),
      }),
      coupons: z.object({
        title: text(40, true),
        subtitle: text(90),
        items: z
          .array(
            z.object({
              id,
              title: text(32, true),
              description: text(120),
              redeem: text(160, false, true),
              color: z.enum(COUPON_COLORS),
              icon: z.enum(COUPON_ICONS),
            }),
          )
          .min(1)
          .max(12),
        redeemButton: text(24, true),
        redeemedLabel: text(20, true),
        footer: text(40, true),
      }),
      photowall: z.object({
        title: text(40, true),
        subtitle: text(90),
        photos: z.array(z.object({ id, image: mediaRef, caption: text(30) })).min(1).max(12),
      }),
      final: z.object({
        title: text(60, true),
        message: text(300, false, true),
        notes: z.array(text(50, true)).max(6),
        signature: text(40),
        button: text(36, true),
        afterMessage: text(200, false, true),
        photo: mediaRef,
        heart: z.enum(FINAL_HEARTS),
      }),
      theme: z.object({
        preset: z.enum(PRESETS),
        primary: hex,
        secondary: hex,
        background: hex,
        paper: hex,
        text: hex,
        button: hex,
        fonts: z.enum(FONT_PAIRS),
        border: z.enum(BORDERS),
        backdrop: z.enum(BACKDROPS),
        motion: z.enum(MOTION),
        hearts: z.boolean(),
        sparkles: z.boolean(),
        lights: z.boolean(),
      }),
      responses: z.object({
        /** When on, the recipient's typed answers and coupon redemptions are sent to the creator. */
        collect: z.boolean(),
      }),
      copy: z.object({
        next: text(20, true),
        back: text(20, true),
        restart: text(24, true),
      }),
    })
    .superRefine((c, ctx) => {
      // Ids must be unique within their list (they key responses and React lists).
      const lists: [string, { id: string }[]][] = [
        ["quiz.questions", c.quiz.questions],
        ["timeline.events", c.timeline.events],
        ["scrapbook.photos", c.scrapbook.photos],
        ["scrapbook.categories", c.scrapbook.categories],
        ["calendar.dates", c.calendar.dates],
        ["letter.tabs", c.letter.tabs],
        ["coupons.items", c.coupons.items],
        ["photowall.photos", c.photowall.photos],
      ];
      for (const [path, list] of lists) {
        if (new Set(list.map((x) => x.id)).size !== list.length) ctx.addIssue({ code: "custom", path: path.split("."), message: "Duplicate id" });
      }
      c.quiz.questions.forEach((q, i) => {
        if ((q.type === "choice" || q.type === "image") && q.correct !== null && q.correct >= q.options.length) {
          ctx.addIssue({ code: "custom", path: ["quiz", "questions", i, "correct"], message: "The right answer must be one of the options" });
        }
      });
      if (!strict) return;
      // Publishing: photo-only sections that are switched on need their photos.
      const on = new Set(c.sections.filter((s) => s.enabled).map((s) => s.id));
      if (on.has("scrapbook")) c.scrapbook.photos.forEach((p, i) => !p.image && ctx.addIssue({ code: "custom", path: ["scrapbook", "photos", i, "image"], message: "Add a photo" }));
      if (on.has("photowall")) c.photowall.photos.forEach((p, i) => !p.image && ctx.addIssue({ code: "custom", path: ["photowall", "photos", i, "image"], message: "Add a photo" }));
      if (c.music.mode === "file" && !c.music.audio) ctx.addIssue({ code: "custom", path: ["music", "audio"], message: "Upload a song or pick the music box" });
    });
}

export const draftContentSchema = factory(false);
export const publishContentSchema = factory(true);

export type LoveContent = z.output<typeof publishContentSchema>;
export type MediaRef = LoveContent["welcome"]["photo"];
export type Question = LoveContent["quiz"]["questions"][number];
export type LoveTheme = LoveContent["theme"];

/** Every asset id referenced by a piece of content, with the kind it must be. */
export function referencedAssets(c: LoveContent): { id: string; kind: "image" | "audio" }[] {
  const imgs: MediaRef[] = [c.welcome.photo, c.unlock.photo, c.final.photo];
  for (const q of c.quiz.questions) {
    if (q.type === "choice") imgs.push(q.photo);
    if (q.type === "image") for (const o of q.options) imgs.push(o.image);
  }
  for (const e of c.timeline.events) imgs.push(e.photo);
  for (const p of c.scrapbook.photos) imgs.push(p.image);
  for (const p of c.photowall.photos) imgs.push(p.image);
  const out: { id: string; kind: "image" | "audio" }[] = [];
  for (const r of imgs) if (r) out.push({ id: r.assetId, kind: "image" });
  if (c.music.audio) out.push({ id: c.music.audio.assetId, kind: "audio" });
  return out;
}

/** Items a recipient can respond to, with the label stored next to the response (server-derived). */
export function respondableItem(c: LoveContent, kind: "text" | "slider" | "coupon", itemId: string): string | null {
  if (kind === "coupon") return c.coupons.items.find((x) => x.id === itemId)?.title ?? null;
  const q = c.quiz.questions.find((x) => x.id === itemId);
  return q && q.type === kind ? q.prompt : null;
}

/** Short random id for new list items (editor side). */
export function newItemId() {
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("") + "x";
}
