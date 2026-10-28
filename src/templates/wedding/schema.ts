import { z } from "zod";
import { cleanText } from "@/templates/scrapbook/schema";

/**
 * Content schema for "Royal Burgundy" (template key `wedding`): an interactive wedding
 * invitation. Same rules as the other templates: plain text only (rendered through JSX), a
 * draft variant for autosave and a strict variant for Publish. Every link the page shows
 * (maps, calendar) is built by the template from these fields — customers never store URLs.
 */

export const SCHEMA_VERSION = 1 as const;

/** Sections after the cover, in page order. Each can be switched off. */
export const SECTION_IDS = ["couple", "countdown", "schedule", "location", "dresscode", "rsvp"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const PRESETS = ["royal", "emerald", "midnight", "blush", "custom"] as const;
export const MUSIC_MODES = ["none", "file", "musicbox"] as const;
export const DATE_STYLES = ["dots", "long"] as const;

const HEX = /^#[0-9a-f]{6}$/i;
const ID = /^[a-z0-9]{4,16}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
/** "+05:30" style offsets that real time zones use. */
const OFFSET = /^[+-](0\d|1[0-4]):(00|30|45)$/;

export function isValidIsoDate(v: string) {
  if (!ISO_DATE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && y <= 2200 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
export const isValidTime = (v: string) => TIME.test(v);
export const isValidOffset = (v: string) => OFFSET.test(v);

/** Upper bound for "number of guests attending" in one RSVP, whatever the couple sets. */
export const MAX_PARTY = 20;

function factory(strict: boolean) {
  const text = (max: number, required = false, multiline = false) =>
    z
      .string()
      .max(max * 4)
      .transform((v) => cleanText(v, multiline))
      .pipe(strict && required ? z.string().min(1, "Required").max(max) : z.string().max(max));

  const id = z.string().regex(ID, "Invalid id");
  const mediaRef = z.object({ assetId: z.uuid() }).nullable();
  const hex = z.string().regex(HEX, "Use a colour like #5b1727").transform((v) => v.toLowerCase());
  const optDate = z.string().refine((v) => v === "" || isValidIsoDate(v), "Use a valid date");
  const optTime = z.string().refine((v) => v === "" || isValidTime(v), "Use a time like 17:30");

  return z
    .object({
      schemaVersion: z.literal(SCHEMA_VERSION),
      couple: z.object({
        brideName: text(40, true),
        groomName: text(40, true),
        /** Shown on the wax seal, e.g. "M&A". */
        initials: text(6, true),
      }),
      event: z.object({
        date: strict ? z.string().refine(isValidIsoDate, "Pick the wedding date") : optDate,
        time: strict ? z.string().refine(isValidTime, "Pick the start time") : optTime,
        /** The venue's UTC offset, so the countdown is right wherever a guest opens it. */
        utcOffset: z.string().regex(OFFSET, "Pick a time zone"),
      }),
      sections: z.object(Object.fromEntries(SECTION_IDS.map((s) => [s, z.boolean()])) as Record<SectionId, z.ZodBoolean>),
      envelope: z.object({
        enabled: z.boolean(),
        hint: text(40),
      }),
      cover: z.object({
        title: text(30, true),
        dateStyle: z.enum(DATE_STYLES),
        scrollHint: text(24),
      }),
      intro: z.object({
        heading: text(60, true),
        message: text(400, true, true),
        photos: z.array(z.object({ id, image: mediaRef, caption: text(40) })).max(3),
      }),
      countdown: z.object({
        title: text(40, true),
        afterMessage: text(120, true),
      }),
      schedule: z.object({
        title: text(40, true),
        items: z
          .array(z.object({ id, time: optTime, title: text(40, true), note: text(80) }))
          .min(1)
          .max(12),
      }),
      location: z.object({
        title: text(40, true),
        venueName: text(80, true),
        address: text(200, false, true),
        /** What Google Maps should search for: an address, a place name or "lat,lng". */
        mapQuery: text(200),
        showMap: z.boolean(),
        photo: mediaRef,
      }),
      dresscode: z.object({
        title: text(40, true),
        message: text(240, false, true),
        colors: z.array(z.object({ id, hex, name: text(24) })).max(6),
        illustration: z.boolean(),
      }),
      rsvp: z.object({
        title: text(40, true),
        message: text(200, false, true),
        button: text(12, true),
        /** Last day guests can reply ("" = until the wedding). */
        deadline: optDate,
        maxGuests: z.number().int().min(1).max(MAX_PARTY),
        askMessage: z.boolean(),
        acceptLabel: text(40, true),
        declineLabel: text(40, true),
        thanks: text(160, true, true),
      }),
      music: z.object({
        mode: z.enum(MUSIC_MODES),
        title: text(60),
        audio: mediaRef,
        /** Start when the guest taps the seal (a tap, so browsers allow it). Never on load. */
        startOnOpen: z.boolean(),
      }),
      closing: z.object({
        title: text(40, true),
        message: text(300, false, true),
        saveTheDate: z.boolean(),
      }),
      theme: z.object({
        preset: z.enum(PRESETS),
        wine: hex,
        burgundy: hex,
        rose: hex,
        gold: hex,
        champagne: hex,
        blush: hex,
        ivory: hex,
      }),
    })
    .superRefine((c, ctx) => {
      const lists: [string, { id: string }[]][] = [
        ["intro.photos", c.intro.photos],
        ["schedule.items", c.schedule.items],
        ["dresscode.colors", c.dresscode.colors],
      ];
      for (const [path, list] of lists) {
        if (new Set(list.map((x) => x.id)).size !== list.length) ctx.addIssue({ code: "custom", path: path.split("."), message: "Duplicate id" });
      }
      if (!strict) return;
      if (c.sections.dresscode && !c.dresscode.colors.length && !c.dresscode.message) ctx.addIssue({ code: "custom", path: ["dresscode", "message"], message: "Add a few words or a colour" });
      if (c.music.mode === "file" && !c.music.audio) ctx.addIssue({ code: "custom", path: ["music", "audio"], message: "Upload a song or pick the music box" });
      if (c.rsvp.deadline && c.event.date && c.rsvp.deadline > c.event.date) ctx.addIssue({ code: "custom", path: ["rsvp", "deadline"], message: "The RSVP deadline must be on or before the wedding day" });
    });
}

export const draftContentSchema = factory(false);
export const publishContentSchema = factory(true);

export type WeddingContent = z.output<typeof publishContentSchema>;
export type MediaRef = WeddingContent["location"]["photo"];
export type WeddingTheme = WeddingContent["theme"];

/** Every asset id referenced by a piece of content, with the kind it must be. */
export function referencedAssets(c: WeddingContent): { id: string; kind: "image" | "audio" }[] {
  const out: { id: string; kind: "image" | "audio" }[] = [];
  for (const p of c.intro.photos) if (p.image) out.push({ id: p.image.assetId, kind: "image" });
  if (c.location.photo) out.push({ id: c.location.photo.assetId, kind: "image" });
  if (c.music.audio) out.push({ id: c.music.audio.assetId, kind: "audio" });
  return out;
}

/** "Meera & Arjun" (dashboard titles, closing line). */
export function coupleName(c: Pick<WeddingContent, "couple">) {
  const a = c.couple.brideName.trim();
  const b = c.couple.groomName.trim();
  return a && b ? `${a} & ${b}` : a || b;
}

// ───────────────────────── RSVP (shared by the form and the server) ─────────────────────────

/** What a guest sends. The server re-validates it against the PUBLISHED invitation. */
export const rsvpInputSchema = z
  .object({
    name: z
      .string()
      .max(320)
      .transform((v) => cleanText(v))
      .pipe(z.string().min(2, "Please enter your name").max(80, "That name is too long")),
    attending: z.boolean(),
    guests: z.number().int().min(0).max(MAX_PARTY),
    message: z
      .string()
      .max(2000)
      .transform((v) => cleanText(v, true))
      .pipe(z.string().max(500, "Please keep your message under 500 characters")),
  })
  .superRefine((r, ctx) => {
    if (r.attending && r.guests < 1) ctx.addIssue({ code: "custom", path: ["guests"], message: "How many of you are coming?" });
  });
export type RsvpInput = z.output<typeof rsvpInputSchema>;

/**
 * Applies the couple's settings to a valid input: guest limit, message on/off, and
 * "declining" always means zero guests. Returns an error message or the row to store.
 */
export function applyRsvpRules(c: WeddingContent, r: RsvpInput): { error: string } | { row: RsvpInput } {
  if (r.attending && r.guests > c.rsvp.maxGuests) return { error: `You can reply for up to ${c.rsvp.maxGuests} ${c.rsvp.maxGuests === 1 ? "guest" : "guests"}.` };
  return { row: { name: r.name, attending: r.attending, guests: r.attending ? r.guests : 0, message: c.rsvp.askMessage ? r.message : "" } };
}

/** Same guest name → same key, so one guest can't be counted twice ("  Priya  SHARMA" = "priya sharma"). */
export const rsvpNameKey = (name: string) => cleanText(name).toLocaleLowerCase("en").replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();

/** Short random id for new list items (editor side). */
export function newItemId() {
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("") + "x";
}
