"use client";

import { useMemo, useState } from "react";
import { ChibiCouple, Heart } from "../art";
import { useLove } from "../context";
import { NavRow, Paper, StepTitle } from "../parts";
import { daysUntil, formatDate, MONTHS_LONG, parseIso, WEEKDAYS } from "../text";

type Mark = { id: string; label: string; date: string; yearly: boolean };

/**
 * 11. Special dates. Nothing is hardcoded: the calendar opens on the month of the next
 * upcoming special date (yearly dates repeat), and can be paged to any month.
 */
export function Calendar({ today }: { today: Date }) {
  const { c, fill } = useLove();
  const k = c.calendar;
  const marks: Mark[] = useMemo(() => k.dates.filter((d) => parseIso(d.date)).map((d) => ({ id: d.id, label: d.label, date: d.date, yearly: d.repeatsYearly })), [k.dates]);

  const [view, setView] = useState(() => {
    let best: { y: number; m: number; n: number } | null = null;
    for (const d of marks) {
      const n = daysUntil(d.date, d.yearly, today);
      if (n === null) continue;
      const at = new Date(today.getFullYear(), today.getMonth(), today.getDate() + n);
      if (!best || n < best.n) best = { y: at.getFullYear(), m: at.getMonth(), n };
    }
    if (best) return { y: best.y, m: best.m };
    const first = marks[0] ? parseIso(marks[0].date) : null;
    return first ? { y: first.y, m: first.m } : { y: today.getFullYear(), m: today.getMonth() };
  });

  const markFor = (y: number, m: number, d: number) => marks.filter((x) => {
    const p = parseIso(x.date)!;
    return p.m === m && p.d === d && (x.yearly ? y >= p.y : y === p.y);
  });

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: firstDow }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const isToday = (d: number) => view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate();
  const move = (delta: number) => setView((v) => {
    const t = new Date(v.y, v.m + delta, 1);
    return { y: t.getFullYear(), m: t.getMonth() };
  });

  return (
    <div className="lu-scene lu-paper-scene">
      <Paper className="lu-cal-paper">
        <div className="lu-cal-layout">
          <div className="lu-cal">
            <StepTitle className="lu-cal-title">{fill(k.title)}</StepTitle>
            <div className="lu-cal-head">
              <button type="button" className="lu-cal-arrow" onClick={() => move(-1)} aria-label="Previous month">
                ‹
              </button>
              <p className="lu-cal-month" aria-live="polite">
                {MONTHS_LONG[view.m]} <span>{view.y}</span> <Heart className="lu-inline-heart" filled={false} />
              </p>
              <button type="button" className="lu-cal-arrow" onClick={() => move(1)} aria-label="Next month">
                ›
              </button>
            </div>
            <table className="lu-cal-grid">
              <thead>
                <tr>
                  {WEEKDAYS.map((w) => (
                    <th key={w} scope="col">
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cells.length / 7 }, (_, r) => (
                  <tr key={r}>
                    {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                      if (!d) return <td key={i} />;
                      const m = markFor(view.y, view.m, d);
                      return (
                        <td key={i} className={`${m.length ? "marked" : ""} ${isToday(d) ? "today" : ""}`}>
                          {m.length ? (
                            <span className="lu-cal-mark" title={m.map((x) => fill(x.label)).join(", ")}>
                              <Heart />
                              <span className="lu-cal-num">{d}</span>
                              <span className="lu-sr">{m.map((x) => fill(x.label)).join(", ")}</span>
                            </span>
                          ) : (
                            <span className="lu-cal-num">{d}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <ChibiCouple className="lu-chibi lu-chibi-cal" />
          </div>
          <aside className="lu-cal-list" aria-label={fill(k.listTitle) || "Special dates"}>
            {k.listTitle && <h2 className="lu-cal-list-title">{fill(k.listTitle)}</h2>}
            <ul>
              {marks.map((d) => {
                const n = daysUntil(d.date, d.yearly, today);
                const p = parseIso(d.date)!;
                return (
                  <li key={d.id}>
                    <button type="button" onClick={() => setView({ y: d.yearly && n !== null ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + n).getFullYear() : p.y, m: p.m })}>
                      <span className="lu-cal-list-heart" aria-hidden="true">
                        <Heart />
                      </span>
                      <span>
                        <span className="lu-cal-list-date">
                          <time dateTime={d.date}>{formatDate(d.date)}</time>
                        </span>
                        <span className="lu-cal-list-label">{fill(d.label)}</span>
                        {n !== null && <span className="lu-cal-list-in">{n === 0 ? "today ♡" : `in ${n} day${n === 1 ? "" : "s"}`}{d.yearly ? " · every year" : ""}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {marks.length === 0 && <p className="lu-empty">Special dates will appear here ♡</p>}
          </aside>
        </div>
        <NavRow />
      </Paper>
    </div>
  );
}
