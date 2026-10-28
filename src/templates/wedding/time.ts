import { isValidIsoDate, isValidOffset, isValidTime, type WeddingContent } from "./schema";

/**
 * Dates, countdown and outbound links for the wedding invitation. Pure functions (no
 * Intl time-zone lookups), so the server, the page and the tests all agree.
 */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return { y, m, d };
}

/** The wedding's start as an absolute instant, or null while the date/time are incomplete. */
export function eventInstant(date: string, time: string, offset: string): Date | null {
  if (!isValidIsoDate(date) || !isValidTime(time) || !isValidOffset(offset)) return null;
  const { y, m, d } = parts(date);
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const sign = offset[0] === "-" ? -1 : 1;
  const [oh, om] = offset.slice(1).split(":").map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - sign * (oh * 60 + om) * 60_000);
}

/** End of a calendar day at the venue (RSVP deadlines are inclusive). */
export function endOfDay(date: string, offset: string): Date | null {
  const start = eventInstant(date, "00:00", offset);
  return start ? new Date(start.getTime() + 86_400_000 - 1) : null;
}

/** RSVPs close at the end of the deadline day (venue time), or when the wedding starts — whichever is first. */
export function rsvpClosesAt(c: Pick<WeddingContent, "event" | "rsvp">): Date | null {
  const start = eventInstant(c.event.date, c.event.time, c.event.utcOffset);
  const deadline = c.rsvp.deadline ? endOfDay(c.rsvp.deadline, c.event.utcOffset) : null;
  if (deadline && start) return deadline < start ? deadline : start;
  return deadline ?? start;
}

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

/** Never negative: once the moment has come, everything is 0 and `done` is true. */
export function countdown(target: Date, now: Date): Countdown {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86_400), hours: Math.floor((s % 86_400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: false };
}

/** "10.10.26" */
export function formatDots(date: string) {
  if (!isValidIsoDate(date)) return "";
  const { y, m, d } = parts(date);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${String(y % 100).padStart(2, "0")}`;
}

/** "Friday, November 20, 2026" */
export function formatLong(date: string) {
  if (!isValidIsoDate(date)) return "";
  const { y, m, d } = parts(date);
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "17:00" → "5:00 PM"; `short` drops ":00" ("5 PM"), like the printed schedule. */
export function formatTime(time: string, short = false) {
  if (!isValidTime(time)) return "";
  const [h, m] = time.split(":").map(Number) as [number, number];
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ap = h < 12 ? "AM" : "PM";
  return short && m === 0 ? `${h12} ${ap}` : `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

/** Google Maps search for the configured destination (works in the app and the browser). */
export function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

/** Keyless embed of the same search, for the inline map. */
export function mapsEmbedUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query.trim())}&output=embed`;
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

type CalendarEvent = { title: string; start: Date; hours: number; location: string; details: string };

export function googleCalendarUrl(e: CalendarEvent) {
  const end = new Date(e.start.getTime() + e.hours * 3_600_000);
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${stamp(e.start)}/${stamp(end)}`, location: e.location, details: e.details });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** RFC 5545 text escaping (commas, semicolons, backslashes, newlines). */
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** A one-event .ics file as a data: URL (Apple Calendar, Outlook…). */
export function icsDataUrl(e: CalendarEvent, uid: string) {
  const end = new Date(e.start.getTime() + e.hours * 3_600_000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Royal Burgundy//Wedding Invitation//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp(e.start)}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${icsText(e.title)}`,
    `LOCATION:${icsText(e.location)}`,
    `DESCRIPTION:${icsText(e.details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

/** Common venue offsets for the studio's time-zone picker. */
export const UTC_OFFSETS: [string, string][] = [
  ["+05:30", "India (IST, UTC+5:30)"],
  ["+05:45", "Nepal (UTC+5:45)"],
  ["+06:00", "Bangladesh (UTC+6)"],
  ["+05:00", "Pakistan / Maldives (UTC+5)"],
  ["+04:00", "UAE / Oman (UTC+4)"],
  ["+03:00", "Saudi Arabia / Qatar / Kuwait (UTC+3)"],
  ["+08:00", "Singapore / Malaysia (UTC+8)"],
  ["+07:00", "Thailand / Indonesia (UTC+7)"],
  ["+09:00", "Japan / Korea (UTC+9)"],
  ["+10:00", "Sydney (UTC+10)"],
  ["+11:00", "Sydney, summer (UTC+11)"],
  ["+12:00", "New Zealand (UTC+12)"],
  ["+13:00", "New Zealand, summer (UTC+13)"],
  ["+00:00", "UK, winter / Portugal (UTC+0)"],
  ["+01:00", "UK, summer / Central Europe, winter (UTC+1)"],
  ["+02:00", "Central Europe, summer / South Africa (UTC+2)"],
  ["-03:00", "Brazil (UTC−3)"],
  ["-04:00", "US Eastern, summer / Atlantic (UTC−4)"],
  ["-05:00", "US Eastern, winter / Central, summer (UTC−5)"],
  ["-06:00", "US Central, winter / Mountain, summer (UTC−6)"],
  ["-07:00", "US Pacific, summer / Mountain, winter (UTC−7)"],
  ["-08:00", "US Pacific, winter (UTC−8)"],
  ["-10:00", "Hawaii (UTC−10)"],
];
