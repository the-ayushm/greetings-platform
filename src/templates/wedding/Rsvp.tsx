"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FloralCorner, WaxSeal } from "./art";
import { store, useWedding } from "./context";
import { applyRsvpRules, rsvpInputSchema } from "./schema";
import { Lines } from "./sections";
import { formatLong, rsvpClosesAt } from "./time";

type Replied = { name: string; attending: boolean };

export function RsvpSection() {
  const { c, fill, storageKey, mode } = useWedding();
  const [open, setOpen] = useState(false);
  const [replied, setReplied] = useState<Replied | null>(null);
  const [closed, setClosed] = useState(false);
  const key = `wd:rsvp:${storageKey}`;

  useEffect(() => {
    // Client-only facts: an earlier reply from this browser, and whether replies have closed.
    const t = rsvpClosesAt(c);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClosed(Boolean(t && Date.now() > t.getTime()));
    if (mode !== "live") return;
    try {
      const v = JSON.parse(store.get(key) ?? "null") as Replied | null;
      if (v && typeof v.name === "string") setReplied(v);
    } catch {
      /* ignore */
    }
  }, [c, key, mode]);

  return (
    <section className="wd-band wd-band-blush wd-rsvp" aria-labelledby="rsvp-title" id="wd-rsvp" data-section="rsvp">
      <FloralCorner className="wd-band-floral wd-band-floral-left" dense={false} />
      <div className="wd-band-inner wd-reveal">
        <h2 className="wd-script wd-rsvp-title" id="rsvp-title">
          {fill(c.rsvp.title)}
        </h2>
        {c.rsvp.message && (
          <p className="wd-invite-text">
            <Lines text={fill(c.rsvp.message)} />
          </p>
        )}
        {c.rsvp.deadline && !closed && <p className="wd-muted">Kindly reply by {formatLong(c.rsvp.deadline)}</p>}
        {closed ? (
          <p className="wd-after" role="status">
            RSVPs are now closed. Thank you ♡
          </p>
        ) : (
          <>
            <button type="button" className="wd-rsvp-seal" onClick={() => setOpen(true)} aria-haspopup="dialog" data-testid="wd-rsvp-open">
              <WaxSeal initials={fill(c.rsvp.button)} tone="deep" className="wd-rsvp-wax" />
              <span className="wd-rsvp-hint">
                <svg viewBox="0 0 24 12" aria-hidden="true" focusable="false">
                  <path d="M2 10l10-8 10 8" />
                </svg>
                {replied ? "You've replied ♡ tap to see" : "Tap to respond"}
              </span>
            </button>
          </>
        )}
      </div>
      {open && <RsvpDialog onClose={() => setOpen(false)} replied={replied} onReplied={(r) => (setReplied(r), store.set(key, JSON.stringify(r)))} />}
    </section>
  );
}

type FieldErrors = Partial<Record<"name" | "attending" | "guests" | "message", string>>;

function RsvpDialog({ onClose, replied, onReplied }: { onClose: () => void; replied: Replied | null; onReplied: (r: Replied) => void }) {
  const { c, fill, mode, sendRsvp } = useWedding();
  const uid = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: people never see or fill it
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(replied ? "done" : "idle");
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState<Replied | null>(replied);

  // Modal behaviour: focus inside, Escape closes, background doesn't scroll, focus returns.
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("input, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>("button, input, textarea, select, a[href]")].filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (!f.length) return;
      const first = f[0]!;
      const last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const parsed = rsvpInputSchema.safeParse({ name, attending: attending ?? false, guests: attending ? guests : 0, message });
    const errs: FieldErrors = {};
    if (attending === null) errs.attending = "Please choose one";
    if (!parsed.success) for (const i of parsed.error.issues) errs[i.path[0] as keyof FieldErrors] ??= i.message;
    if (parsed.success && attending !== null) {
      const ruled = applyRsvpRules(c, parsed.data);
      if ("error" in ruled) errs.guests = ruled.error;
    }
    setErrors(errs);
    if (Object.keys(errs).length || !parsed.success) return;

    if (mode !== "live" || !sendRsvp) {
      setServerError(mode === "preview" ? "This is your preview — replies are collected on the published invitation." : "This is a demo invitation, so replies aren't sent anywhere.");
      return;
    }
    setStatus("sending");
    const r = await sendRsvp({ ...parsed.data, website });
    if (r.ok) {
      const rep = { name: parsed.data.name, attending: parsed.data.attending };
      setDone(rep);
      onReplied(rep);
      setStatus("done");
    } else {
      setStatus("error");
      setServerError(r.message);
    }
  }

  const max = c.rsvp.maxGuests;
  return (
    <div className="wd-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} className="wd-modal-panel" role="dialog" aria-modal="true" aria-labelledby={`${uid}-t`}>
        <button type="button" className="wd-modal-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3 className="wd-modal-title" id={`${uid}-t`}>
          {fill(c.rsvp.title)}
        </h3>
        {status === "done" && done ? (
          <div className="wd-rsvp-done" role="status" data-testid="wd-rsvp-done">
            <p className="wd-script wd-rsvp-thanks">Thank you, {done.name}!</p>
            <p>
              <Lines text={fill(c.rsvp.thanks)} />
            </p>
            <p className="wd-muted">{done.attending ? "We've noted that you'll be there ♡" : "We'll miss you — thank you for letting us know."}</p>
            <button type="button" className="wd-btn wd-btn-solid" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="wd-form">
            <div className="wd-field">
              <label htmlFor={`${uid}-name`}>Your name</label>
              <input id={`${uid}-name`} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${uid}-name-e` : undefined} />
              {errors.name && (
                <p className="wd-err" id={`${uid}-name-e`}>
                  {errors.name}
                </p>
              )}
            </div>
            <fieldset className="wd-field" aria-describedby={errors.attending ? `${uid}-att-e` : undefined}>
              <legend>Will you be attending?</legend>
              <label className="wd-radio">
                <input type="radio" name={`${uid}-att`} checked={attending === true} onChange={() => setAttending(true)} />
                <span>{fill(c.rsvp.acceptLabel)}</span>
              </label>
              <label className="wd-radio">
                <input type="radio" name={`${uid}-att`} checked={attending === false} onChange={() => setAttending(false)} />
                <span>{fill(c.rsvp.declineLabel)}</span>
              </label>
              {errors.attending && (
                <p className="wd-err" id={`${uid}-att-e`}>
                  {errors.attending}
                </p>
              )}
            </fieldset>
            {attending && (
              <div className="wd-field">
                <label htmlFor={`${uid}-guests`}>Number of guests attending (including you)</label>
                <select id={`${uid}-guests`} value={guests} onChange={(e) => setGuests(Number(e.target.value))} aria-invalid={Boolean(errors.guests)}>
                  {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {errors.guests && <p className="wd-err">{errors.guests}</p>}
              </div>
            )}
            {c.rsvp.askMessage && (
              <div className="wd-field">
                <label htmlFor={`${uid}-msg`}>
                  A message for the couple <span className="wd-muted">(optional)</span>
                </label>
                <textarea id={`${uid}-msg`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3} />
                {errors.message && <p className="wd-err">{errors.message}</p>}
              </div>
            )}
            <div className="wd-hp" aria-hidden="true">
              <label htmlFor={`${uid}-web`}>Website</label>
              <input id={`${uid}-web`} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            {serverError && (
              <p className="wd-err wd-err-box" role="alert">
                {serverError}
              </p>
            )}
            <button type="submit" className="wd-btn wd-btn-solid wd-submit" disabled={status === "sending"} data-testid="wd-rsvp-submit">
              {status === "sending" ? (
                <>
                  <span className="wd-spin" aria-hidden="true" /> Sending…
                </>
              ) : (
                "Submit"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
