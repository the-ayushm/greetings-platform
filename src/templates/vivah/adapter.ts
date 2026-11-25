import { isValidIsoDate, isValidTime, waNumber, type VivahContent } from "./schema";

/**
 * Turns stored content (+ signed media URLs) into the data object the plain-JS runtime in
 * public/vivah-assets/js/invite.js renders. Works on DRAFT content too (the studio preview), so
 * every missing value gets a harmless stand-in instead of breaking the page.
 */

export const ASSET_BASE = "/vivah-assets";
export const DEFAULT_SONG = `${ASSET_BASE}/music/piya-ghar-aavenge.mp3`;

export type MediaMap = {
  images: Record<string, { src: string; srcSet?: string }>;
  audio: Record<string, { src: string }>;
};

type Person = { first: string; full: string; parents: string };
export type InviteData = {
  lead: "groom" | "bride";
  groom: Person;
  bride: Person;
  invocation: string;
  invocationMeaning: string;
  hosts: string;
  message: string;
  date: string;
  city: string;
  hashtag: string;
  events: { name: string; start: string; noTime: boolean; venue: string; address: string; note: string; dress: string }[];
  rsvp: { phone: string; by: string; maxGuests: number; demo: boolean };
  countdownTitle: string;
  rsvpTitle: string;
  closing: string;
  music: string | null;
  gallery: string[];
  hide: string[];
  noBranding: boolean;
  brandName: string;
  brandHref: string;
};
export type InviteStrings = { openingLine: [string, string]; eventsTitle?: string; momentsTitle?: string };

const IST = "+05:30";

/** A date ~90 days ahead (India date), for drafts that don't have one yet. */
function placeholderDate(now = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now + 90 * 86_400_000));
}

const iso = (date: string, time: string) => `${date}T${time}:00${IST}`;

export function toInviteData(
  c: VivahContent,
  media: MediaMap,
  opts: { brandHref: string; demoGallery?: string[]; demo?: boolean; now?: number },
): { data: InviteData; strings: InviteStrings } {
  const weddingDate = isValidIsoDate(c.wedding.date) ? c.wedding.date : placeholderDate(opts.now);
  const weddingTime = isValidTime(c.wedding.time) ? c.wedding.time : "11:00";
  const person = (p: Person, fallback: string): Person => ({ first: p.first.trim() || fallback, full: p.full.trim(), parents: p.parents.trim() });

  const events = c.events.map((e) => {
    const date = isValidIsoDate(e.date) ? e.date : weddingDate;
    const timed = isValidTime(e.time);
    return {
      name: e.name || "Celebration",
      start: iso(date, timed ? e.time : "12:00"),
      noTime: !timed,
      venue: e.venue || "Venue",
      address: e.address,
      note: e.note,
      dress: e.dress,
    };
  });

  const gallery = opts.demoGallery ?? c.gallery.map((p) => (p.image ? media.images[p.image.assetId]?.src : undefined)).filter((s): s is string => !!s);
  const music = c.music.mode === "default" ? DEFAULT_SONG : c.music.mode === "file" && c.music.audio ? (media.audio[c.music.audio.assetId]?.src ?? null) : null;
  const hide = (Object.keys(c.sections) as (keyof VivahContent["sections"])[]).filter((k) => !c.sections[k]);

  return {
    data: {
      lead: c.couple.lead,
      groom: person(c.couple.groom, "Groom"),
      bride: person(c.couple.bride, "Bride"),
      invocation: c.blessing.invocation,
      invocationMeaning: c.blessing.invocationMeaning,
      hosts: c.blessing.hosts,
      message: c.blessing.message,
      date: iso(weddingDate, weddingTime),
      city: c.wedding.city,
      hashtag: c.wedding.hashtag,
      events,
      rsvp: { phone: waNumber(c.rsvp.phone), by: isValidIsoDate(c.rsvp.by) ? iso(c.rsvp.by, "00:00") : "", maxGuests: c.rsvp.maxGuests, demo: !!opts.demo },
      countdownTitle: c.words.countdownTitle,
      rsvpTitle: c.words.rsvpTitle,
      closing: c.words.closing,
      music,
      gallery,
      hide,
      noBranding: false,
      brandName: "Digital Gifting",
      brandHref: opts.brandHref,
    },
    strings: {
      openingLine: [c.opening.line1, c.opening.line2],
      ...(c.words.eventsTitle ? { eventsTitle: c.words.eventsTitle } : {}),
      ...(c.words.momentsTitle ? { momentsTitle: c.words.momentsTitle } : {}),
    },
  };
}

/** Moves every date in the demo so the wedding is `days` ahead of today (live countdown). */
export function shiftDemoDates(c: VivahContent, days: number, now = Date.now()): VivahContent {
  const target = placeholderDate(now - 90 * 86_400_000 + days * 86_400_000);
  const base = Date.parse(`${c.wedding.date}T00:00:00Z`);
  const delta = Date.parse(`${target}T00:00:00Z`) - base;
  const move = (d: string) => (isValidIsoDate(d) ? new Date(Date.parse(`${d}T00:00:00Z`) + delta).toISOString().slice(0, 10) : d);
  return {
    ...c,
    wedding: { ...c.wedding, date: move(c.wedding.date) },
    events: c.events.map((e) => ({ ...e, date: move(e.date) })),
    rsvp: { ...c.rsvp, by: move(c.rsvp.by) },
  };
}
