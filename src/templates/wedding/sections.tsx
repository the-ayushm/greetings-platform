"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Arch, FloralCorner, FloralDivider, Flourish, Outfits, Rose, SwanLake, Venue } from "./art";
import { useWedding } from "./context";
import type { MediaRef } from "./schema";
import { coupleName } from "./schema";
import { countdown, eventInstant, formatDots, formatLong, formatTime, googleCalendarUrl, icsDataUrl, mapsEmbedUrl, mapsUrl, type Countdown as CountdownParts } from "./time";

/** "&" set in the italic serif: the script font's ampersand reads like a letter. */
function Amp({ text }: { text: string }) {
  const parts = text.split("&");
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="wd-amp-inline">&amp;</span>}
        </span>
      ))}
    </>
  );
}

/** Customer text with line breaks, as React nodes (never HTML). `amp` restyles "&" in script headings. */
export function Lines({ text, amp = false }: { text: string; amp?: boolean }) {
  const rows = text.split("\n");
  return (
    <>
      {rows.map((r, i) => (
        <span key={i}>
          {amp ? <Amp text={r} /> : r}
          {i < rows.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function Title({ children, id }: { children: ReactNode; id: string }) {
  return (
    <div className="wd-title-wrap">
      <h2 className="wd-title" id={id}>
        {children}
      </h2>
      <Flourish className="wd-flourish" />
    </div>
  );
}

/** A section band with the torn-paper edges of the printed card. */
function Band({ id, children, tone = "blush", corner }: { id: string; children: ReactNode; tone?: "blush" | "ivory"; corner?: "left" | "right" }) {
  return (
    <section className={`wd-band wd-band-${tone}`} aria-labelledby={`${id}-title`} id={`wd-${id}`} data-section={id}>
      {corner && <FloralCorner className={`wd-band-floral wd-band-floral-${corner}`} flip={corner === "right" ? "x" : ""} dense={false} />}
      <div className="wd-band-inner wd-reveal">{children}</div>
    </section>
  );
}

function Photo({ media, alt, className }: { media: MediaRef; alt: string; className?: string }) {
  const { image, reportMediaError, mode } = useWedding();
  const img = image(media?.assetId);
  if (!media) return null;
  if (!img) return mode === "preview" ? <div className={`${className ?? ""} wd-photo-ph`}>your photo</div> : null;
  return <img className={className} src={img.src} srcSet={img.srcSet} sizes="(max-width: 560px) 90vw, 500px" alt={alt} loading="lazy" decoding="async" onError={() => reportMediaError(media.assetId)} />;
}

// ───────────────────────── cover ─────────────────────────

export function Cover() {
  const { c, fill } = useWedding();
  const date = c.cover.dateStyle === "dots" ? formatDots(c.event.date) : formatLong(c.event.date);
  return (
    <header className="wd-cover" id="wd-cover" data-section="cover">
      <div className="wd-cover-sky" aria-hidden="true" />
      <Arch className="wd-arch" />
      <FloralCorner className="wd-cover-floral wd-cf-tl" />
      <FloralCorner className="wd-cover-floral wd-cf-tr" flip="x" />
      <div className="wd-cover-text">
        <p className="wd-cover-label">{fill(c.cover.title)}</p>
        {date && <p className="wd-cover-date">{date}</p>}
        <h1 className="wd-names">
          <span className="wd-name">{c.couple.brideName || "Bride"}</span>
          <span className="wd-amp" aria-label="and">
            &amp;
          </span>
          <span className="wd-name">{c.couple.groomName || "Groom"}</span>
        </h1>
        {c.cover.scrollHint && (
          <a className="wd-scroll" href="#wd-main">
            <span>{c.cover.scrollHint}</span>
            <svg viewBox="0 0 24 12" aria-hidden="true" focusable="false">
              <path d="M2 2l10 8 10-8" />
            </svg>
          </a>
        )}
      </div>
      <div className="wd-cover-lake" aria-hidden="true">
        <SwanLake className="wd-swans" />
        <FloralCorner className="wd-cover-floral wd-cf-bl" flip="y" />
        <FloralCorner className="wd-cover-floral wd-cf-br" flip="xy" />
      </div>
    </header>
  );
}

// ───────────────────────── couple ─────────────────────────

export function Couple() {
  const { c, fill } = useWedding();
  const photos = c.intro.photos.filter((p) => p.image);
  return (
    <Band id="couple" corner="right">
      <h2 className="wd-script wd-invite-head" id="couple-title">
        <Lines text={fill(c.intro.heading)} amp />
      </h2>
      <p className="wd-invite-text">
        <Lines text={fill(c.intro.message)} />
      </p>
      {photos.length > 0 && (
        <ul className={`wd-photos wd-photos-${photos.length}`}>
          {photos.map((p) => (
            <li key={p.id}>
              <figure className="wd-photo-frame">
                <Photo media={p.image} alt={p.caption || coupleName(c)} className="wd-photo" />
                {p.caption && <figcaption className="wd-photo-cap">{fill(p.caption)}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      )}
      <FloralDivider className="wd-divider" />
    </Band>
  );
}

// ───────────────────────── countdown ─────────────────────────

const UNITS: [keyof Omit<CountdownParts, "done">, string][] = [
  ["days", "Days"],
  ["hours", "Hours"],
  ["minutes", "Minutes"],
  ["seconds", "Seconds"],
];

/** Live countdown. Rendered after mount (server and guest clocks differ), ticking each second. */
export function CountdownSection() {
  const { c, fill } = useWedding();
  const target = eventInstant(c.event.date, c.event.time, c.event.utcOffset);
  const targetMs = target?.getTime() ?? null;
  const [left, setLeft] = useState<CountdownParts | null>(null);

  useEffect(() => {
    if (targetMs === null) return;
    const tick = () => setLeft(countdown(new Date(targetMs), new Date()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [targetMs]);

  return (
    <Band id="countdown" tone="ivory">
      <Title id="countdown-title">{fill(c.countdown.title)}</Title>
      {target === null ? (
        <p className="wd-muted">The date will be announced soon ♡</p>
      ) : left?.done ? (
        <p className="wd-after" role="status">
          {fill(c.countdown.afterMessage)}
        </p>
      ) : (
        <div className="wd-count" role="timer" aria-live="off" aria-label={left ? `${left.days} days, ${left.hours} hours, ${left.minutes} minutes and ${left.seconds} seconds to go` : "Countdown"}>
          {UNITS.map(([k, label], i) => (
            <div key={k} className="wd-count-cell">
              <span className="wd-count-num" data-testid={`wd-count-${k}`}>
                {left ? String(left[k]).padStart(k === "days" ? 1 : 2, "0") : "--"}
              </span>
              <span className="wd-count-label">{label}</span>
              {i < UNITS.length - 1 && (
                <span className="wd-count-sep" aria-hidden="true">
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Band>
  );
}

// ───────────────────────── schedule ─────────────────────────

export function Schedule() {
  const { c, fill } = useWedding();
  const items = c.schedule.items;
  return (
    <Band id="schedule" corner="left">
      <Title id="schedule-title">{fill(c.schedule.title)}</Title>
      <ol className="wd-timeline">
        {items.map((it, i) => {
          const edge = i === 0 || i === items.length - 1;
          return (
            <li key={it.id} className="wd-tl-row">
              <span className="wd-tl-time">{formatTime(it.time, true)}</span>
              <span className={`wd-tl-mark ${edge ? "wd-tl-rose" : ""}`} aria-hidden="true">
                {edge ? (
                  <svg viewBox="-55 -55 110 110" focusable="false">
                    <Rose tone="deep" size={1} />
                  </svg>
                ) : (
                  <i />
                )}
              </span>
              <span className="wd-tl-what">
                <span className="wd-tl-title">{fill(it.title)}</span>
                {it.note && <span className="wd-tl-note">{fill(it.note)}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </Band>
  );
}

// ───────────────────────── location ─────────────────────────

export function Location() {
  const { c, fill, mode } = useWedding();
  const l = c.location;
  const query = (l.mapQuery || [l.venueName, l.address.replace(/\n/g, ", ")].filter(Boolean).join(", ")).trim();
  const when = [formatLong(c.event.date), formatTime(c.event.time)].filter(Boolean).join(" at ");
  return (
    <Band id="location" tone="ivory">
      <Title id="location-title">{fill(l.title)}</Title>
      <p className="wd-venue-name">{fill(l.venueName) || "Venue to be announced"}</p>
      {when && <p className="wd-venue-when">{when}</p>}
      {l.address && (
        <address className="wd-venue-addr">
          <Lines text={fill(l.address)} />
        </address>
      )}
      <div className="wd-venue-art">{l.photo ? <Photo media={l.photo} alt={l.venueName} className="wd-venue-photo" /> : <Venue className="wd-venue-svg" />}</div>
      {query && l.showMap && (
        <div className="wd-map">
          <iframe
            title={`Map of ${l.venueName || "the venue"}`}
            src={mapsEmbedUrl(query)}
            loading="lazy"
            referrerPolicy="no-referrer"
            // The demo/preview never needs the guest to interact before scrolling past.
            tabIndex={mode === "live" ? 0 : -1}
          />
        </div>
      )}
      {query ? (
        <a className="wd-btn wd-btn-gold" href={mapsUrl(query)} target="_blank" rel="noopener noreferrer" data-testid="wd-maps">
          Open in Google Maps
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
          </svg>
        </a>
      ) : (
        <p className="wd-muted">Directions will be shared soon.</p>
      )}
    </Band>
  );
}

// ───────────────────────── dress code ─────────────────────────

export function DressCode() {
  const { c, fill } = useWedding();
  const d = c.dresscode;
  return (
    <Band id="dresscode" corner="right">
      <Title id="dresscode-title">{fill(d.title)}</Title>
      {d.message && (
        <p className="wd-invite-text">
          <Lines text={fill(d.message)} />
        </p>
      )}
      {d.colors.length > 0 && (
        <ul className="wd-swatches" aria-label="Suggested colours">
          {d.colors.map((col) => (
            <li key={col.id}>
              <span className="wd-swatch" style={{ background: col.hex }} />
              {col.name && <span className="wd-swatch-name">{col.name}</span>}
            </li>
          ))}
        </ul>
      )}
      {d.illustration && <Outfits className="wd-outfits" colors={d.colors.map((x) => x.hex)} />}
    </Band>
  );
}

// ───────────────────────── closing ─────────────────────────

export function Closing() {
  const { c, fill, mode, storageKey, reopenEnvelope } = useWedding();
  const start = eventInstant(c.event.date, c.event.time, c.event.utcOffset);
  const names = coupleName(c);
  const where = [c.location.venueName, c.location.address.replace(/\n/g, ", ")].filter(Boolean).join(", ");
  const cal = start ? { title: `${names ? `${names}'s ` : ""}Wedding`, start, hours: 5, location: where, details: fill(c.intro.message) } : null;
  return (
    <footer className="wd-closing" id="wd-closing" data-section="closing">
      <FloralCorner className="wd-close-floral wd-close-tl" />
      <FloralCorner className="wd-close-floral wd-close-br" flip="xy" />
      <div className="wd-closing-inner wd-reveal">
        <p className="wd-script wd-closing-title">
          <Lines text={fill(c.closing.title)} amp />
        </p>
        {c.closing.message && (
          <p className="wd-invite-text">
            <Lines text={fill(c.closing.message)} />
          </p>
        )}
        <FloralDivider className="wd-divider" />
        <p className="wd-closing-names">{names}</p>
        {c.event.date && <p className="wd-closing-date">{formatLong(c.event.date)}</p>}
        {c.closing.saveTheDate && cal && (
          <div className="wd-save">
            <p className="wd-save-label">Save the date</p>
            <div className="wd-save-row">
              <a className="wd-btn wd-btn-ghost" href={googleCalendarUrl(cal)} target="_blank" rel="noopener noreferrer">
                Google Calendar
              </a>
              <a className="wd-btn wd-btn-ghost" href={icsDataUrl(cal, `${storageKey}-${c.event.date}@wedding-invite`)} download="wedding.ics">
                Apple / Outlook
              </a>
            </div>
          </div>
        )}
        {c.envelope.enabled && mode !== "preview" && (
          <button type="button" className="wd-link" onClick={reopenEnvelope}>
            ↺ Open the envelope again
          </button>
        )}
      </div>
    </footer>
  );
}
