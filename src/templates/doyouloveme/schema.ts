import { z } from "zod";
import { cleanText } from "@/templates/scrapbook/schema";

/**
 * Content schema for "Do You Love Me?" (template key `doyouloveme`): one playful question.
 * Every "No" changes the No button's words and grows the Yes button until Yes fills the
 * screen; Yes opens a celebration. Same rules as the other templates: plain text only
 * (rendered through JSX), a draft variant for autosave and a strict variant for Publish.
 */

export const SCHEMA_VERSION = 1 as const;

export const PRESETS = ["rose", "peach", "lavender", "cherry", "custom"] as const;
export const CHARACTERS = ["bunny", "bear", "kitty", "mochi", "none"] as const;
export const INTENSITIES = ["calm", "playful", "extra"] as const;
export const MUSIC_MODES = ["none", "musicbox", "file"] as const;

/** Bounds for the "No" message sequence (each message is one press of No). */
export const MIN_NO_MESSAGES = 3;
export const MAX_NO_MESSAGES = 20;

const HEX = /^#[0-9a-f]{6}$/i;

function factory(strict: boolean) {
  const text = (max: number, required = false, multiline = false) =>
    z
      .string()
      .max(max * 4)
      .transform((v) => cleanText(v, multiline))
      .pipe(strict && required ? z.string().min(1, "Required").max(max) : z.string().max(max));

  const mediaRef = z.object({ assetId: z.uuid() }).nullable();
  const hex = z.string().regex(HEX, "Use a colour like #e0445f").transform((v) => v.toLowerCase());

  return z
    .object({
      schemaVersion: z.literal(SCHEMA_VERSION),
      people: z.object({
        /** Who is asking (signature, "{sender}"). */
        senderName: text(40, true),
        /** Who is being asked ("{partner}"). */
        partnerName: text(40, true),
      }),
      intro: z.object({
        greeting: text(60),
        message: text(200, false, true),
      }),
      question: z.object({
        text: text(80, true),
        yesText: text(24, true),
        noText: text(24, true),
        /** One message per press of No, in order. After the last one, Yes takes over the screen. */
        noMessages: z.array(text(48, true)).min(strict ? MIN_NO_MESSAGES : 1).max(MAX_NO_MESSAGES),
        /** Small line under the full-screen Yes. */
        takeoverHint: text(60),
      }),
      finale: z.object({
        heading: text(60, true),
        subheading: text(120),
        message: text(600, false, true),
        signature: text(60),
        photo: mediaRef,
        replay: z.boolean(),
      }),
      music: z.object({
        mode: z.enum(MUSIC_MODES),
        title: text(60),
        audio: mediaRef,
        /** Start the music when they press Yes (that tap is their permission). Never on load. */
        playOnYes: z.boolean(),
      }),
      look: z.object({
        character: z.enum(CHARACTERS),
        intensity: z.enum(INTENSITIES),
        /** Offer the visitor a sound toggle (soft taps and chimes). Off until they turn it on. */
        sounds: z.boolean(),
      }),
      responses: z.object({
        /** Tell the sender (dashboard) when they say Yes and after how many "No"s. */
        notify: z.boolean(),
      }),
      theme: z.object({
        preset: z.enum(PRESETS),
        bg1: hex,
        bg2: hex,
        card: hex,
        ink: hex,
        accent: hex,
        yes: hex,
        no: hex,
        gold: hex,
      }),
    })
    .superRefine((c, ctx) => {
      if (!strict) return;
      if (c.music.mode === "file" && !c.music.audio) ctx.addIssue({ code: "custom", path: ["music", "audio"], message: "Upload a song or pick the music box" });
    });
}

export const draftContentSchema = factory(false);
export const publishContentSchema = factory(true);

export type AskContent = z.output<typeof publishContentSchema>;
export type AskTheme = AskContent["theme"];
export type Character = AskContent["look"]["character"];
export type Intensity = AskContent["look"]["intensity"];
export type MediaRef = AskContent["finale"]["photo"];

/** Every asset id referenced by a piece of content, with the kind it must be. */
export function referencedAssets(c: AskContent): { id: string; kind: "image" | "audio" }[] {
  const out: { id: string; kind: "image" | "audio" }[] = [];
  if (c.finale.photo) out.push({ id: c.finale.photo.assetId, kind: "image" });
  if (c.music.audio) out.push({ id: c.music.audio.assetId, kind: "audio" });
  return out;
}

/** Replaces {partner} and {sender} in customer text. Unknown braces are left alone. */
export function fillTokens(s: string, c: Pick<AskContent, "people">) {
  return s.replace(/\{(partner|sender)\}/g, (_, k: string) => (k === "partner" ? c.people.partnerName : c.people.senderName).trim());
}

/**
 * How far the Yes button has grown: 0 before any "No", 1 at the last message. The number of
 * presses that triggers the full-screen Yes is `noMessages.length + 1`.
 */
export function growth(noCount: number, messages: number) {
  if (messages <= 0) return 1;
  return Math.max(0, Math.min(1, noCount / messages));
}

/** The words on the No button after `noCount` presses. */
export function noLabel(c: Pick<AskContent, "question">, noCount: number) {
  if (noCount <= 0) return c.question.noText;
  const list = c.question.noMessages;
  return list[Math.min(noCount, list.length) - 1] ?? c.question.noText;
}

/** What the sender sees in the dashboard when they say Yes (stored server-side, plain text). */
export function answerSummary(noCount: number) {
  if (noCount <= 0) return "Said YES straight away ♡";
  return `Said YES after pressing “No” ${noCount} ${noCount === 1 ? "time" : "times"} ♡`;
}
