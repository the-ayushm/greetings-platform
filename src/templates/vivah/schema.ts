import { z } from "zod";
import { cleanText } from "@/templates/scrapbook/schema";

/**
 * Content schema for the Shiv–Parvati wedding invitation (template key `vivah`). Same rules as
 * the other templates: plain text only, a draft variant for autosave and a strict variant for
 * Publish. Links on the page (WhatsApp, Maps, Calendar) are built by the runtime from these
 * fields — customers never store URLs. All dates and times are Indian Standard Time.
 */

export const SCHEMA_VERSION = 1 as const;

/** Sections between the hero and the closing page, in page order. Each can be switched off. */
export const SECTION_IDS = ["families", "scratch", "countdown", "events", "gallery", "rsvp"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const MUSIC_MODES = ["default", "file", "none"] as const;
export const LEADS = ["groom", "bride"] as const;

export const MAX_EVENTS = 8;
export const MAX_PHOTOS = 10;
export const MAX_PARTY = 20;

const ID = /^[a-z0-9]{4,16}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidIsoDate(v: string) {
  if (!ISO_DATE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && y <= 2200 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
export const isValidTime = (v: string) => TIME.test(v);

/**
 * WhatsApp number in international format, digits only ("" if it can't be one).
 * A 10-digit number is taken as Indian (+91); a leading 0 or 00 is dropped.
 */
export function waNumber(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return /^[1-9]\d{9,14}$/.test(d) ? d : "";
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
  const optDate = z.string().refine((v) => v === "" || isValidIsoDate(v), "Use a valid date");
  const optTime = z.string().refine((v) => v === "" || isValidTime(v), "Use a time like 19:30");
  const person = z.object({
    /** Short name used everywhere (opening, hero, closing). */
    first: text(30, true),
    /** Full name on the families page ("" = first name). */
    full: text(60),
    /** "Son of Mrs. … & Mr. …" */
    parents: text(120),
  });

  return z
    .object({
      schemaVersion: z.literal(SCHEMA_VERSION),
      couple: z.object({
        /** Whose name comes first. */
        lead: z.enum(LEADS),
        groom: person,
        bride: person,
      }),
      wedding: z.object({
        date: strict ? z.string().refine(isValidIsoDate, "Pick the wedding date") : optDate,
        time: strict ? z.string().refine(isValidTime, "Pick the muhurat / start time") : optTime,
        city: text(60, true),
        hashtag: text(40),
      }),
      opening: z.object({
        line1: text(40),
        line2: text(40),
      }),
      blessing: z.object({
        invocation: text(200),
        invocationMeaning: text(80),
        hosts: text(80),
        message: text(300, true, true),
      }),
      events: z
        .array(
          z.object({
            id,
            name: text(30, true),
            date: strict ? z.string().refine(isValidIsoDate, "Pick the date") : optDate,
            /** "" = no time shown. */
            time: optTime,
            venue: text(80, true),
            address: text(200),
            note: text(100),
            dress: text(40),
          }),
        )
        .min(1)
        .max(MAX_EVENTS),
      gallery: z.array(z.object({ id, image: mediaRef })).max(MAX_PHOTOS),
      rsvp: z.object({
        /** WhatsApp number guests reply to (any format; normalised with waNumber()). */
        phone: z.string().max(24),
        /** Reply-by date ("" = not shown). */
        by: optDate,
        maxGuests: z.number().int().min(1).max(MAX_PARTY),
      }),
      music: z.object({
        mode: z.enum(MUSIC_MODES),
        audio: mediaRef,
      }),
      words: z.object({
        countdownTitle: text(40),
        eventsTitle: text(40),
        momentsTitle: text(40),
        rsvpTitle: text(40),
        closing: text(200, false, true),
      }),
      sections: z.object(Object.fromEntries(SECTION_IDS.map((s) => [s, z.boolean()])) as Record<SectionId, z.ZodBoolean>),
    })
    .superRefine((c, ctx) => {
      const lists: [string, { id: string }[]][] = [
        ["events", c.events],
        ["gallery", c.gallery],
      ];
      for (const [path, list] of lists) {
        if (new Set(list.map((x) => x.id)).size !== list.length) ctx.addIssue({ code: "custom", path: [path], message: "Duplicate id" });
      }
      if (!strict) return;
      if (c.sections.rsvp && !waNumber(c.rsvp.phone)) ctx.addIssue({ code: "custom", path: ["rsvp", "phone"], message: "Enter the WhatsApp number guests should reply to" });
      if (c.music.mode === "file" && !c.music.audio) ctx.addIssue({ code: "custom", path: ["music", "audio"], message: "Upload your song or pick the default one" });
      if (c.rsvp.by && c.wedding.date && c.rsvp.by > c.wedding.date) ctx.addIssue({ code: "custom", path: ["rsvp", "by"], message: "The reply-by date must be on or before the wedding day" });
    });
}

export const draftContentSchema = factory(false);
export const publishContentSchema = factory(true);

export type VivahContent = z.output<typeof publishContentSchema>;
export type VivahEvent = VivahContent["events"][number];

/** Every asset id referenced by a piece of content, with the kind it must be. */
export function referencedAssets(c: VivahContent): { id: string; kind: "image" | "audio" }[] {
  const out: { id: string; kind: "image" | "audio" }[] = [];
  for (const p of c.gallery) if (p.image) out.push({ id: p.image.assetId, kind: "image" });
  if (c.music.mode === "file" && c.music.audio) out.push({ id: c.music.audio.assetId, kind: "audio" });
  return out;
}

/** "Rudra & Gauri" in the couple's chosen order (dashboard titles). */
export function coupleName(c: Pick<VivahContent, "couple">) {
  const [a, b] = c.couple.lead === "bride" ? [c.couple.bride, c.couple.groom] : [c.couple.groom, c.couple.bride];
  return [a.first.trim(), b.first.trim()].filter(Boolean).join(" & ");
}

/** Short random id for new list items (editor side). */
export function newItemId() {
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("") + "x";
}
