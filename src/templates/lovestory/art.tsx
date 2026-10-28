/**
 * Original vector artwork for the love story template (drawn for this project — no stock,
 * no external URLs). Decorative pieces are aria-hidden; nothing here renders customer text.
 */
import { useId, type CSSProperties } from "react";
import type { LoveContent } from "./schema";

const HEART_PATH = "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";

export function Heart({ className, style, filled = true }: { className?: string; style?: CSSProperties; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true" focusable="false">
      <path d={HEART_PATH} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinejoin="round" />
    </svg>
  );
}

export function Sparkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true" focusable="false">
      <path d="M12 1.5c.6 4.6 2.1 7.4 4.6 8.9 1.6 1 3.6 1.4 5.9 1.6-2.3.2-4.3.6-5.9 1.6-2.5 1.5-4 4.3-4.6 8.9-.6-4.6-2.1-7.4-4.6-8.9-1.6-1-3.6-1.4-5.9-1.6 2.3-.2 4.3-.6 5.9-1.6 2.5-1.5 4-4.3 4.6-8.9z" fill="currentColor" />
    </svg>
  );
}

/** Deterministic pseudo-random sequence (same art on server and client). */
function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * A sagging string of warm bulbs. The wire stretches with the container; bulbs are positioned
 * on the same quadratic curves in percentages so they stay round at any width.
 */
export function FairyLights({ count = 14, className }: { count?: number; className?: string }) {
  const segs: [number, number, number][] = [
    [0, 4, 50],
    [50, 4, 100],
  ];
  const bulbs = Array.from({ length: count }, (_, i) => {
    const x = ((i + 0.5) / count) * 100;
    const seg = x < 50 ? 0 : 1;
    const [x0, , x2] = segs[seg]!;
    const t = (x - x0) / (x2 - x0);
    // Quadratic from y=6 → control y=34 → y=6 (in a 0..40 box)
    const y = (1 - t) ** 2 * 6 + 2 * (1 - t) * t * 34 + t ** 2 * 6;
    return { x, y: (y / 40) * 100, d: (i * 0.37) % 2.4 };
  });
  return (
    <div className={`lu-lights ${className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="lu-lights-wire">
        <path d="M0,6 Q25,34 50,6 Q75,34 100,6" fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      {bulbs.map((b, i) => (
        <span key={i} className="lu-bulb" style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${b.d}s` }} />
      ))}
    </div>
  );
}

export function Skyline({ className }: { className?: string }) {
  const r = rand(7);
  const buildings: { x: number; w: number; h: number }[] = [];
  for (let x = 0; x < 400; ) {
    const w = 14 + Math.floor(r() * 26);
    const h = 30 + Math.floor(r() * 80);
    buildings.push({ x, w, h });
    x += w + (r() > 0.7 ? 3 : 0);
  }
  const windows: { x: number; y: number; o: number }[] = [];
  for (const b of buildings) {
    for (let wy = 120 - b.h + 6; wy < 116; wy += 7) {
      for (let wx = b.x + 3; wx < b.x + b.w - 3; wx += 6) if (r() > 0.55) windows.push({ x: wx, y: wy, o: 0.35 + r() * 0.65 });
    }
  }
  return (
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true" focusable="false">
      {buildings.map((b, i) => (
        <rect key={i} x={b.x} y={120 - b.h} width={b.w} height={b.h} fill="var(--lu-city, #1a1236)" />
      ))}
      {windows.map((w, i) => (
        <rect key={`w${i}`} x={w.x} y={w.y} width="2.4" height="3" fill="#ffd68a" opacity={w.o} />
      ))}
    </svg>
  );
}

/** Two people seen from behind, her head on his shoulder, looking at the city. */
export function CoupleBack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 230" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="165" cy="226" rx="160" ry="14" fill="rgba(0,0,0,.25)" />
      {/* blanket */}
      <path d="M0 230 C20 196 70 188 120 196 C170 204 230 186 320 200 L320 230 Z" fill="var(--lu-blanket, #b8456a)" />
      <path d="M0 230 C30 212 80 206 130 212 C190 220 250 206 320 214 L320 230Z" fill="rgba(255,255,255,.12)" />
      {/* him: hoodie */}
      <path d="M42 206 C40 150 66 120 112 116 C160 118 186 146 186 206 Z" fill="#cfc8d6" />
      <path d="M78 128 C88 150 136 152 148 126 C134 118 92 118 78 128 Z" fill="#b9b1c3" />
      <path d="M112 118 L112 170" stroke="#aaa1b6" strokeWidth="2" />
      {/* him: head */}
      <ellipse cx="114" cy="86" rx="42" ry="44" fill="#3a2418" />
      <path d="M74 80 C78 50 100 38 120 40 C144 42 158 60 156 84 C146 70 128 62 112 64 C96 66 82 72 74 80 Z" fill="#4a2f20" />
      <ellipse cx="72" cy="94" rx="6" ry="9" fill="#e8b79c" />
      {/* her: sweater */}
      <path d="M150 210 C150 168 168 142 204 140 C244 142 264 170 266 212 Z" fill="#f2a7bf" />
      <path d="M176 150 C190 162 220 162 236 148" stroke="#e48eaa" strokeWidth="3" fill="none" />
      {/* her: hair, head tilted onto his shoulder */}
      <g transform="rotate(-16 200 108)">
        <ellipse cx="202" cy="104" rx="38" ry="40" fill="#4a2a1c" />
        <path d="M166 104 C162 140 170 176 184 196 C196 176 214 172 236 182 C244 160 244 128 238 104 Z" fill="#4a2a1c" />
        <path d="M172 92 C182 70 214 64 232 84 C214 78 192 80 172 92 Z" fill="#5b3524" />
      </g>
    </svg>
  );
}

/** A small cute couple hugging, cheek to cheek. */
export function ChibiCouple({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 210" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="120" cy="204" rx="92" ry="6" fill="rgba(0,0,0,.08)" />
      {/* bodies */}
      <path d="M30 206 C32 168 56 150 92 148 C120 150 128 172 126 206 Z" fill="#f6b7c9" />
      <path d="M112 206 C112 170 128 148 160 146 C196 148 214 170 212 206 Z" fill="#fbfbfb" stroke="#eadfe3" strokeWidth="2" />
      <path d="M96 168 C110 160 130 160 146 170" stroke="#f6b7c9" strokeWidth="14" strokeLinecap="round" fill="none" />
      {/* girl */}
      <path d="M26 104 C22 54 56 28 92 30 C130 32 150 62 146 108 C150 150 136 170 124 176 L60 176 C40 168 26 146 26 104 Z" fill="#6b3f2a" />
      <circle cx="90" cy="98" r="46" fill="#ffe3d3" />
      <path d="M44 92 C46 56 70 40 96 42 C122 44 138 62 136 88 C120 72 100 64 82 70 C66 74 54 82 44 92 Z" fill="#6b3f2a" />
      <path d="M64 100 q7 7 14 0" stroke="#4a2b20" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M98 100 q7 7 14 0" stroke="#4a2b20" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="62" cy="116" rx="9" ry="6" fill="#ff9fb4" opacity=".75" />
      <ellipse cx="116" cy="116" rx="9" ry="6" fill="#ff9fb4" opacity=".75" />
      <path d="M84 120 q5 4 10 0" stroke="#c45a6a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M40 60 l10 -10 l4 12 z" fill="#ff6f93" />
      {/* boy */}
      <circle cx="156" cy="96" r="44" fill="#ffe6d6" />
      <path d="M112 92 C110 56 132 40 160 40 C188 40 204 60 200 92 C190 74 176 68 160 72 C150 62 138 64 128 74 C122 80 116 86 112 92 Z" fill="#4b2c1f" />
      <path d="M132 98 q7 7 14 0" stroke="#3b2218" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M164 98 q7 7 14 0" stroke="#3b2218" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="128" cy="114" rx="9" ry="6" fill="#ff9fb4" opacity=".7" />
      <ellipse cx="184" cy="114" rx="9" ry="6" fill="#ff9fb4" opacity=".7" />
      <path d="M150 118 q6 5 12 0" stroke="#b9545f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* hearts */}
      <path d={HEART_PATH} transform="translate(108 6) scale(1.1)" fill="#ff5f8a" />
      <path d={HEART_PATH} transform="translate(196 22) scale(.7)" fill="#ff8fb0" />
      <path d={HEART_PATH} transform="translate(22 26) scale(.6)" fill="#ff8fb0" />
    </svg>
  );
}

function Flower({ x, y, r, rot, petal, center }: { x: number; y: number; r: number; rot: number; petal: string; center: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy={-r * 0.62} rx={r * 0.42} ry={r * 0.62} transform={`rotate(${a})`} fill={petal} />
      ))}
      <circle r={r * 0.28} fill={center} />
    </g>
  );
}

/** A corner bouquet. `flip` mirrors it for the opposite corner. */
export function Flowers({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 160 140" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true" focusable="false">
      <path d="M10 140 C30 100 60 80 96 64" stroke="#6d8f5a" strokeWidth="3" fill="none" />
      <path d="M30 140 C50 110 70 104 120 100" stroke="#6d8f5a" strokeWidth="3" fill="none" />
      <ellipse cx="56" cy="96" rx="14" ry="6" transform="rotate(-30 56 96)" fill="#86a86f" />
      <ellipse cx="84" cy="108" rx="14" ry="6" transform="rotate(10 84 108)" fill="#86a86f" />
      <Flower x={98} y={62} r={20} rot={8} petal="#f59ab8" center="#f7d36b" />
      <Flower x={124} y={100} r={15} rot={30} petal="#fbc4d4" center="#f7d36b" />
      <Flower x={60} y={70} r={12} rot={-10} petal="#e7708f" center="#ffe08a" />
      <Flower x={30} y={110} r={10} rot={20} petal="#fde2ea" center="#f0b44c" />
    </svg>
  );
}

const SCENES = ["sunset", "night", "beach", "cafe", "road", "home"] as const;
type Scene = (typeof SCENES)[number];

/** Illustrated stand-in for a photo that isn't there (demo, empty draft, or a deleted file). */
export function SceneArt({ seed = 0, className, label }: { seed?: number; className?: string; label?: string }) {
  const s: Scene = SCENES[Math.abs(seed) % SCENES.length]!;
  const id = `sa${s}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const sky: Record<Scene, [string, string]> = {
    sunset: ["#ffb38a", "#f06d8e"],
    night: ["#1b1846", "#5b3a7a"],
    beach: ["#ffd29a", "#ff8a7a"],
    cafe: ["#4b2a2a", "#a65b45"],
    road: ["#9fb7e8", "#f2a5b8"],
    home: ["#5a3448", "#e3a07c"],
  };
  return (
    <svg viewBox="0 0 160 120" className={className} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[s][0]} />
          <stop offset="1" stopColor={sky[s][1]} />
        </linearGradient>
      </defs>
      <rect width="160" height="120" fill={`url(#${id})`} />
      {s === "sunset" && (
        <>
          <circle cx="80" cy="74" r="22" fill="#ffe0a3" opacity=".9" />
          <path d="M0 84 C40 70 60 90 100 78 C130 70 150 80 160 76 L160 120 L0 120Z" fill="#7a3a5c" />
          <path d="M60 84 C64 70 72 66 76 70 C80 66 88 70 90 84 Z" fill="#2c1630" />
        </>
      )}
      {s === "night" && (
        <>
          {[12, 34, 58, 90, 118, 140, 24, 70, 104].map((x, i) => (
            <circle key={i} cx={x} cy={10 + ((i * 17) % 40)} r={i % 3 ? 0.9 : 1.4} fill="#fff" opacity=".85" />
          ))}
          <circle cx="126" cy="26" r="10" fill="#fff2c4" />
          <circle cx="122" cy="23" r="9" fill="#2a2152" />
          <path d="M0 96 h14 v-24 h12 v14 h10 v-30 h14 v40 h12 v-20 h12 v26 h16 v-36 h12 v22 h14 v-16 h12 v24 h22 V120 H0Z" fill="#140f2e" />
        </>
      )}
      {s === "beach" && (
        <>
          <circle cx="110" cy="60" r="16" fill="#fff1b8" />
          <rect y="72" width="160" height="22" fill="#5aa0c8" />
          <path d="M0 90 C40 84 120 96 160 88 L160 120 L0 120Z" fill="#f6d7a4" />
          <path d="M20 72 C40 68 60 76 80 72" stroke="#ffffff" strokeWidth="1.4" opacity=".6" fill="none" />
        </>
      )}
      {s === "cafe" && (
        <>
          {[20, 50, 80, 110, 140].map((x) => (
            <g key={x}>
              <line x1={x} y1="0" x2={x} y2="16" stroke="#2a1515" />
              <circle cx={x} cy="20" r="5" fill="#ffd27a" />
              <circle cx={x} cy="20" r="11" fill="#ffd27a" opacity=".22" />
            </g>
          ))}
          <rect x="30" y="84" width="100" height="6" rx="3" fill="#2a1515" />
          <rect x="56" y="70" width="14" height="14" rx="3" fill="#fbe7d6" />
          <rect x="88" y="70" width="14" height="14" rx="3" fill="#fbe7d6" />
          <rect y="100" width="160" height="20" fill="#3a1f1f" />
        </>
      )}
      {s === "road" && (
        <>
          <path d="M0 74 L40 50 L70 66 L110 40 L160 70 L160 120 L0 120Z" fill="#6b5a8e" />
          <path d="M0 86 L50 66 L90 80 L130 60 L160 76 L160 120 L0 120Z" fill="#8a6fa4" />
          <path d="M66 120 L80 78 L86 78 L110 120Z" fill="#3b3346" />
          <path d="M80 112 L82 96 M84 88 L84 82" stroke="#ffe6a8" strokeWidth="1.6" />
          <rect x="70" y="96" width="22" height="9" rx="4" fill="#e04a6a" />
        </>
      )}
      {s === "home" && (
        <>
          <rect x="18" y="20" width="44" height="36" rx="3" fill="#ffd9a1" opacity=".85" />
          <line x1="40" y1="20" x2="40" y2="56" stroke="#5a3448" strokeWidth="2" />
          <circle cx="126" cy="40" r="8" fill="#ffe2a8" />
          <circle cx="126" cy="40" r="20" fill="#ffe2a8" opacity=".2" />
          <rect x="16" y="78" width="128" height="30" rx="10" fill="#f3e6ee" />
          <rect x="16" y="70" width="40" height="18" rx="8" fill="#ffffff" />
          <path d="M60 86 C80 76 110 76 140 86 L140 108 L60 108Z" fill="#e58aa8" />
        </>
      )}
    </svg>
  );
}

const ICON_PATHS: Record<LoveContent["coupons"]["items"][number]["icon"], string> = {
  hug: "M7 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm10 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 20c0-4 2.5-6.5 5-6.5 1.6 0 2.8.7 5 3 2.2-2.3 3.4-3 5-3 2.5 0 5 2.5 5 6.5",
  movie: "M3 9h18v11H3zM3 9l2-5 4 1-2 4M9 5l4 1-2 3M13 6l4 1-2 2M9 13l5 2.5L9 18z",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  treat: "M6 11h12l-2 10H8zM5 11a7 7 0 0 1 14 0M12 4V2M9 7.5c1-1 2-1 3 0s2 1 3 0",
  cuddle: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5ZM15 3l.6 1.4L17 5l-1.4.6L15 7l-.6-1.4L13 5l1.4-.6z",
  gift: "M3 10h18v4H3zM5 14h14v7H5zM12 10v11M12 10c-2-4-6-5-6-2.5S10 10 12 10Zm0 0c2-4 6-5 6-2.5S14 10 12 10Z",
  dinner: "M7 2v8a2 2 0 0 0 2 2v10M5 2v6m4-6v6M17 2c-2 1.5-3 4-3 7h3v13",
  travel: "M2 16l20-8-3 9-6-2-3 4v-5l8-6-11 5z",
  music: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  star: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z",
};

export const COUPON_ICON_LABELS: Record<keyof typeof ICON_PATHS, string> = {
  hug: "Hug",
  movie: "Movie",
  sun: "Sunny day",
  treat: "Treat",
  cuddle: "Cuddle",
  gift: "Gift",
  dinner: "Dinner",
  travel: "Trip",
  music: "Music",
  star: "Star",
};

export function CouponIcon({ icon, className }: { icon: keyof typeof ICON_PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[icon]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
