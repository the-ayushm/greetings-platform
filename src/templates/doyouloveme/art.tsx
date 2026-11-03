import type { Character } from "./schema";

/**
 * Original artwork for "Do You Love Me?" — drawn for this project as inline SVG (no stock, no
 * third-party characters). One soft round "buddy" with four ear styles and four moods:
 *   ask   — hopeful, holding a heart
 *   plead — big shiny eyes (after a few "No"s)
 *   sad   — worried brows, a tear, a cracked heart (near the end)
 *   happy — arms up, eyes closed with joy, the heart floating above
 */

export type Mood = "ask" | "plead" | "sad" | "happy";

const LINE = "#4a2230";
const BODY = "#fffdfb";
const PINK = "#ffb3c3";
const EYE = "#3a1724";

export const HEART_PATH = "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.6.7-1.5 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";
export const SPARKLE_PATH = "M12 1.5 13.9 10.1 22.5 12 13.9 13.9 12 22.5 10.1 13.9 1.5 12 10.1 10.1Z";

export function Heart({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} style={style}>
      <path d={HEART_PATH} fill="currentColor" />
    </svg>
  );
}

export function Sparkle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} style={style}>
      <path d={SPARKLE_PATH} fill="currentColor" />
    </svg>
  );
}

function Ears({ kind }: { kind: Character }) {
  const s = { stroke: LINE, strokeWidth: 3.5, strokeLinejoin: "round" as const };
  if (kind === "bunny")
    return (
      <g className="dy-ears">
        <g transform="rotate(-14 58 62)">
          <ellipse cx="58" cy="34" rx="14" ry="33" fill={BODY} {...s} />
          <ellipse cx="58" cy="36" rx="6.5" ry="22" fill={PINK} />
        </g>
        <g transform="rotate(14 102 62)">
          <ellipse cx="102" cy="34" rx="14" ry="33" fill={BODY} {...s} />
          <ellipse cx="102" cy="36" rx="6.5" ry="22" fill={PINK} />
        </g>
      </g>
    );
  if (kind === "bear")
    return (
      <g className="dy-ears">
        <circle cx="42" cy="60" r="17" fill={BODY} {...s} />
        <circle cx="42" cy="60" r="8.5" fill={PINK} />
        <circle cx="118" cy="60" r="17" fill={BODY} {...s} />
        <circle cx="118" cy="60" r="8.5" fill={PINK} />
      </g>
    );
  if (kind === "kitty")
    return (
      <g className="dy-ears">
        <path d="M34 82 L44 30 L76 56 Z" fill={BODY} {...s} />
        <path d="M44 70 L48 44 L64 57 Z" fill={PINK} />
        <path d="M126 82 L116 30 L84 56 Z" fill={BODY} {...s} />
        <path d="M116 70 L112 44 L96 57 Z" fill={PINK} />
      </g>
    );
  // mochi: a little sprout instead of ears
  return (
    <g className="dy-ears">
      <path d="M80 46 C80 36 78 30 74 26" fill="none" stroke={LINE} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M75 27 C66 20 58 24 58 30 C66 34 72 32 75 27 Z" fill="#bfe6c4" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M76 28 C82 18 92 18 94 24 C88 31 81 31 76 28 Z" fill="#bfe6c4" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "happy")
    return (
      <g fill="none" stroke={EYE} strokeWidth="4" strokeLinecap="round">
        <path d="M53 99 Q61 88 69 99" />
        <path d="M91 99 Q99 88 107 99" />
      </g>
    );
  const big = mood === "plead";
  const rx = big ? 10 : mood === "sad" ? 7.5 : 8.5;
  const ry = big ? 12 : mood === "sad" ? 8.5 : 10;
  return (
    <g>
      {[61, 99].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="96" rx={rx} ry={ry} fill={EYE} />
          <circle cx={x + rx * 0.35} cy={96 - ry * 0.38} r={big ? 3.8 : 3} fill="#fff" />
          <circle cx={x - rx * 0.35} cy={96 + ry * 0.35} r={big ? 1.9 : 1.4} fill="#fff" />
        </g>
      ))}
      {mood === "sad" && (
        <g fill="none" stroke={EYE} strokeWidth="3" strokeLinecap="round">
          <path d="M50 80 Q57 79 66 74" />
          <path d="M110 80 Q103 79 94 74" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === "happy")
    return (
      <g>
        <path d="M69 110 Q80 127 91 110 Z" fill={EYE} stroke={EYE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M74 117 Q80 123 86 117 Q80 113.5 74 117 Z" fill="#ff7d95" />
      </g>
    );
  if (mood === "plead") return <ellipse cx="80" cy="114" rx="3.6" ry="4.6" fill={EYE} />;
  if (mood === "sad") return <path d="M71 118 Q80 110 89 118" fill="none" stroke={EYE} strokeWidth="3" strokeLinecap="round" />;
  return <path d="M71 111 q4.5 5.5 9 0 q4.5 5.5 9 0" fill="none" stroke={EYE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
}

/** The buddy. `className` lets the page animate it (idle bob, droop, jump). */
export function Buddy({ kind, mood, className }: { kind: Exclude<Character, "none">; mood: Mood; className?: string }) {
  const s = { stroke: LINE, strokeWidth: 3.5, strokeLinejoin: "round" as const };
  const happy = mood === "happy";
  return (
    <svg viewBox="0 0 160 172" className={className} data-mood={mood} aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="164" rx="42" ry="6" fill="#000" opacity=".08" />
      <Ears kind={kind} />
      {/* feet */}
      <ellipse cx="60" cy="155" rx="13" ry="8" fill={BODY} {...s} />
      <ellipse cx="100" cy="155" rx="13" ry="8" fill={BODY} {...s} />
      {/* raised arms sit behind the body */}
      {happy && (
        <g className="dy-arms-up">
          <ellipse cx="28" cy="96" rx="8" ry="13" transform="rotate(-38 28 96)" fill={BODY} {...s} />
          <ellipse cx="132" cy="96" rx="8" ry="13" transform="rotate(38 132 96)" fill={BODY} {...s} />
        </g>
      )}
      {/* head + body, one soft mochi shape */}
      <path d="M80 46 C119 46 137 76 137 108 C137 141 113 158 80 158 C47 158 23 141 23 108 C23 76 41 46 80 46 Z" fill={BODY} {...s} />
      <ellipse cx="45" cy="110" rx="9.5" ry="6" fill={PINK} opacity=".75" />
      <ellipse cx="115" cy="110" rx="9.5" ry="6" fill={PINK} opacity=".75" />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {mood === "sad" && <path className="dy-tear" d="M53 106 q-5 8 0 11.5 q5 -3.5 0 -11.5 z" fill="#9ad8ff" stroke="#5aa9d6" strokeWidth="1.2" />}
      {happy ? (
        <g className="dy-float-heart">
          <path d={HEART_PATH} transform="translate(64 2) scale(1.35)" fill="var(--dy-accent, #e0445f)" stroke={LINE} strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      ) : (
        <g>
          <path
            d="M80 150 C59 136 60 118 71 118 C76.5 118 80 122 80 126 C80 122 83.5 118 89 118 C100 118 101 136 80 150 Z"
            fill="var(--dy-accent, #e0445f)"
            {...s}
            strokeWidth={3}
          />
          {mood === "sad" && <path d="M81 121 l-4 7 l6 5 l-4 8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
          {mood !== "sad" && <path d="M70 126 q2 -4 6 -4" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2.4" strokeLinecap="round" />}
          <ellipse cx="63" cy="131" rx="7.5" ry="6.5" fill={BODY} {...s} strokeWidth={3} />
          <ellipse cx="97" cy="131" rx="7.5" ry="6.5" fill={BODY} {...s} strokeWidth={3} />
        </g>
      )}
    </svg>
  );
}

/** Mood for the asking screen, from how many times "No" was pressed. */
export function moodFor(noCount: number, total: number): Mood {
  if (noCount <= 0) return "ask";
  return noCount / Math.max(1, total) < 0.5 ? "plead" : "sad";
}
