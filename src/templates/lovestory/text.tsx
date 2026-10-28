import { Fragment, type ReactNode } from "react";
import { isValidIsoDate, type LoveContent } from "./schema";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseIso(v: string): { y: number; m: number; d: number } | null {
  if (!isValidIsoDate(v)) return null;
  const [y, m, d] = v.split("-").map(Number) as [number, number, number];
  return { y, m: m - 1, d };
}

/** "12 Jan 2023" — fixed format so server and browser render identical text. */
export function formatDate(v: string, withYear = true) {
  const p = parseIso(v);
  if (!p) return "";
  return withYear ? `${p.d} ${MONTHS[p.m]} ${p.y}` : `${p.d} ${MONTHS[p.m]}`;
}

/** Whole days from an ISO date to today (local), or null. */
export function daysSince(v: string, now = new Date()) {
  const p = parseIso(v);
  if (!p) return null;
  const start = Date.UTC(p.y, p.m, p.d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const n = Math.floor((today - start) / 86_400_000);
  return n >= 0 ? n : null;
}

/** Days until the next occurrence of a (possibly yearly) date; null when it is in the past. */
export function daysUntil(v: string, yearly: boolean, now = new Date()) {
  const p = parseIso(v);
  if (!p) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  let t = Date.UTC(yearly ? now.getFullYear() : p.y, p.m, p.d);
  if (yearly && t < today) t = Date.UTC(now.getFullYear() + 1, p.m, p.d);
  const n = Math.round((t - today) / 86_400_000);
  return n >= 0 ? n : null;
}

/**
 * Replaces {partner} {me} {pet} {days} in plain text. Output is text, never HTML.
 * {days} becomes the number of days since the relationship start date (or is removed).
 */
export function makeFill(c: Pick<LoveContent, "people">, now?: Date) {
  const days = daysSince(c.people.startDate, now);
  return (s: string) =>
    String(s ?? "")
      .replace(/\{partner\}/g, c.people.partnerName || "you")
      .replace(/\{me\}/g, c.people.creatorName || "me")
      .replace(/\{pet\}/g, c.people.petName || c.people.partnerName || "love")
      .replace(/\{days\}/g, days === null ? "" : days.toLocaleString("en-IN"));
}

/** Plain text with line breaks preserved. */
export function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {p}
        </Fragment>
      ))}
    </>
  );
}

/** **bold** and *italic* inside one line → React nodes. Unmatched markers stay literal. */
function inline(line: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    out.push(m[1] !== undefined ? <strong key={`${key}b${i++}`}>{m[1]}</strong> : <em key={`${key}i${i++}`}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

/**
 * The letter's limited formatting: paragraphs (blank line), line breaks, "- " bullet lists,
 * **bold** and *italic*. Everything becomes JSX text nodes — there is no HTML path at all.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-•]\s+/, ""), `${bi}.${li}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, `${bi}.${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
