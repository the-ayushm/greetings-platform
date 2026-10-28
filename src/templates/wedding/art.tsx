import type { CSSProperties, ReactNode } from "react";

/**
 * Original SVG artwork for the wedding invitation (no stock or third-party images). Colours
 * come from the theme's CSS variables through class names in wedding.css, so every preset
 * recolours the art. Shared gradients live once in <ArtDefs/>.
 */

type P = { className?: string; style?: CSSProperties };

const f1 = (n: number) => n.toFixed(1);
const pt = (r: number, a: number) => `${f1(r * Math.cos(a))} ${f1(r * Math.sin(a))}`;

/** A cupped petal around the centre: scalloped outer edge, pinched towards the middle. */
function petal(r: number, a: number, span: number, pinch: number) {
  const a0 = a - span / 2;
  const a1 = a + span / 2;
  return `M${pt(r * 0.5, a0)}Q${pt(r * 1.1, a0 + span * 0.04)} ${pt(r, a0 + span * 0.32)}Q${pt(r * 1.07, a)} ${pt(r, a1 - span * 0.32)}Q${pt(r * 1.1, a1 - span * 0.04)} ${pt(r * 0.5, a1)}Q${pt(pinch, a)} ${pt(r * 0.5, a0)}Z`;
}

const D = Math.PI / 180;
/** Top-down rose, radius ≈ 50, outer petals first. Built once at module load. */
const ROSE: { d: string; tone: number }[] = (() => {
  const out: { d: string; tone: number }[] = [];
  for (let i = 0; i < 5; i++) out.push({ d: petal(50, (i * 72 - 90) * D, 104 * D, 8), tone: 0 });
  for (let i = 0; i < 5; i++) out.push({ d: petal(40, (i * 72 - 54) * D, 98 * D, 6), tone: 1 });
  for (let i = 0; i < 4; i++) out.push({ d: petal(30, (i * 90 - 20) * D, 112 * D, 4), tone: 2 });
  for (let i = 0; i < 6; i++) out.push({ d: petal(21 - i * 2.4, (i * 137.5 + 10) * D, (150 - i * 8) * D, 1), tone: 3 });
  return out;
})();

export type RoseTone = "deep" | "pink" | "peach" | "blush";

export function Rose({ tone = "deep", x = 0, y = 0, size = 1, rotate = 0 }: { tone?: RoseTone; x?: number; y?: number; size?: number; rotate?: number }) {
  return (
    <g className={`wd-rose wd-rose-${tone}`} transform={`translate(${f1(x)} ${f1(y)}) rotate(${rotate}) scale(${size})`}>
      {ROSE.map((p, i) => (
        <path key={i} d={p.d} className={`wd-petal wd-petal-${p.tone}`} />
      ))}
      <path d="M-4 -2c2-4 8-3 8 1s-5 6-8 3" className="wd-rose-core" />
      <circle r="50" fill="url(#wd-g-rose-shade)" />
    </g>
  );
}

/** A leaf pointing up from its base (0,0), length ≈ 40. */
export function Leaf({ x = 0, y = 0, rotate = 0, size = 1, light = false }: { x?: number; y?: number; rotate?: number; size?: number; light?: boolean }) {
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) rotate(${rotate}) scale(${size})`} className={light ? "wd-leaf wd-leaf-light" : "wd-leaf"}>
      <path d="M0 0C10-8 13-26 0-42C-13-26-10-8 0 0Z" />
      <path d="M0-2V-38M0-14l6-7M0-22l-6-7M0-28l5-6" className="wd-leaf-vein" />
    </g>
  );
}

function Bud({ x, y, rotate = 0, size = 1, tone = "deep" }: { x: number; y: number; rotate?: number; size?: number; tone?: RoseTone }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size})`}>
      <path d="M0 0C-3-12-1-26 0-32" className="wd-stem" />
      <path d="M0-28C-9-30-10-44 0-52C10-44 9-30 0-28Z" className={`wd-bud wd-rose-${tone}`} />
      <path d="M0-28C-6-31-9-36-8-41C-4-36 0-34 0-28ZM0-28C6-31 9-36 8-41C4-36 0-34 0-28Z" className="wd-sepal" />
    </g>
  );
}

/** Tiny white "baby's breath" sprigs. */
function Filler({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} className="wd-filler">
      <path d="M0 0C2-10 6-18 12-24M5-10c-6-4-10-10-11-16M9-18c4-2 9-2 12 0" />
      <circle cx="12" cy="-24" r="2.4" />
      <circle cx="-6" cy="-26" r="2.2" />
      <circle cx="21" cy="-18" r="2" />
      <circle cx="16" cy="-29" r="1.8" />
      <circle cx="-2" cy="-31" r="1.6" />
    </g>
  );
}

/**
 * Corner bouquet (top-left orientation, viewBox 220×220). Flip it with `flip` for the other
 * corners. Used on the cover, section edges and the closing page.
 */
export function FloralCorner({ className, style, flip = "", dense = true }: P & { flip?: "" | "x" | "y" | "xy"; dense?: boolean }) {
  const sx = flip.includes("x") ? -1 : 1;
  const sy = flip.includes("y") ? -1 : 1;
  return (
    <svg viewBox="0 0 220 220" className={className} style={style} aria-hidden="true" focusable="false">
      <g transform={`translate(${sx < 0 ? 220 : 0} ${sy < 0 ? 220 : 0}) scale(${sx} ${sy})`}>
        <Leaf x={70} y={40} rotate={70} size={1.1} />
        <Leaf x={40} y={86} rotate={150} size={1.05} light />
        <Leaf x={118} y={30} rotate={100} size={0.9} light />
        <Leaf x={28} y={128} rotate={170} size={0.85} />
        <Leaf x={150} y={56} rotate={120} size={0.75} />
        <Leaf x={92} y={92} rotate={135} size={0.8} light />
        {dense && <Filler x={136} y={84} rotate={110} />}
        {dense && <Filler x={64} y={130} rotate={160} />}
        <Bud x={160} y={22} rotate={78} size={0.8} tone="pink" />
        <Bud x={24} y={160} rotate={170} size={0.75} />
        <Rose x={52} y={50} size={0.78} tone="deep" rotate={10} />
        <Rose x={114} y={52} size={0.5} tone="pink" rotate={40} />
        <Rose x={46} y={114} size={0.48} tone="peach" rotate={-20} />
        {dense && <Rose x={14} y={14} size={0.42} tone="blush" rotate={60} />}
        {dense && <Rose x={150} y={18} size={0.3} tone="deep" rotate={-30} />}
      </g>
    </svg>
  );
}

/** Thin gold rule with a central rose and scrolls. */
export function FloralDivider({ className }: P) {
  return (
    <svg viewBox="0 0 240 40" className={className} aria-hidden="true" focusable="false">
      <path d="M8 20H92M148 20H232" className="wd-gold-line" />
      <path d="M92 20c6-8 14-8 16-2s-6 8-8 4M148 20c-6-8-14-8-16-2s6 8 8 4M92 20c6 8 14 8 16 2M148 20c-6 8-14 8-16 2" className="wd-gold-line" />
      <Leaf x={112} y={22} rotate={-60} size={0.32} />
      <Leaf x={128} y={22} rotate={60} size={0.32} />
      <Rose x={120} y={20} size={0.16} tone="deep" />
      <circle cx="6" cy="20" r="1.8" className="wd-gold-fill" />
      <circle cx="234" cy="20" r="1.8" className="wd-gold-fill" />
    </svg>
  );
}

/** Small scroll flourish under section titles. */
export function Flourish({ className }: P) {
  return (
    <svg viewBox="0 0 120 16" className={className} aria-hidden="true" focusable="false">
      <path d="M60 8c-8-7-18-7-22-1s6 8 9 3M60 8c8-7 18-7 22-1s-6 8-9 3M38 7C26 10 14 10 4 8M82 7c12 3 24 3 34 1" className="wd-gold-line" />
      <path d="M60 3l3 5-3 5-3-5z" className="wd-gold-fill" />
    </svg>
  );
}

/**
 * Ornate pointed arch with columns and lattice (viewBox 300×620). Stretches to its box; strokes
 * keep their width. The opening is transparent so the cover's sky shows through.
 */
export function Arch({ className }: P) {
  // Ogee (onion-point) arch, as in Mughal and Rajput gateways.
  const inner = "M40 620V220C40 168 78 138 112 116C132 103 144 90 150 64C156 90 168 103 188 116C222 138 260 168 260 220V620Z";
  const line = "M52 620V224C52 178 86 150 118 128C136 116 146 104 150 84C154 104 164 116 182 128C214 150 248 178 248 224V620";
  return (
    <svg viewBox="0 0 300 620" preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false">
      <path d={`M0 0H300V620H0Z${inner}`} fillRule="evenodd" fill="url(#wd-g-stone)" />
      <path d={`M0 0H300V620H0Z${inner}`} fillRule="evenodd" fill="url(#wd-p-jali)" opacity=".55" />
      <path d={inner} className="wd-arch-edge" vectorEffect="non-scaling-stroke" />
      <path d={line} className="wd-arch-line" vectorEffect="non-scaling-stroke" />
      {/* lotus finial */}
      <path d="M150 58c-7-5-8-13 0-24c8 11 7 19 0 24zM150 58c-9 0-15-5-17-11c7 0 13 3 17 11zM150 58c9 0 15-5 17-11c-7 0-13 3-17 11z" className="wd-arch-cap" vectorEffect="non-scaling-stroke" />
      <path d="M150 34v-8" className="wd-arch-line" vectorEffect="non-scaling-stroke" />
      <circle cx="150" cy="24" r="2.5" className="wd-gold-fill" />
      {/* slender columns */}
      <path d="M20 620V262h18v358M262 620V262h18v358" fill="url(#wd-g-column)" className="wd-arch-col" vectorEffect="non-scaling-stroke" />
      <path d="M16 262h26v-10H16zM258 262h26v-10h-26zM16 610h26v10H16zM258 610h26v10h-26z" className="wd-arch-cap" vectorEffect="non-scaling-stroke" />
      <path d="M29 272v330M271 272v330" className="wd-arch-flute" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Two swans facing each other on a still lake, with their reflection (viewBox 300×150). */
export function SwanLake({ className }: P) {
  // Facing right; the mirrored copy faces left. Necks bow outwards and the heads meet: a heart.
  const swan = (
    <g className="wd-swan">
      <path d="M6 92C14 86 18 78 30 76C46 74 58 82 74 84C86 85 96 82 102 78C110 88 104 100 86 104C64 110 26 108 6 92Z" />
      <path d="M28 80C34 66 52 60 72 66C62 66 54 70 50 78C60 72 70 72 78 76C66 80 50 84 28 80Z" className="wd-swan-wing" />
      <path d="M96 82C84 68 80 46 90 32C98 22 112 20 118 28C122 32 122 37 118 40C112 38 106 33 100 36C92 42 94 62 104 78Z" />
      <path d="M117 35L131 42L116 41Z" className="wd-swan-beak" />
      <circle cx="112" cy="30" r="1.5" className="wd-swan-eye" />
    </g>
  );
  return (
    <svg viewBox="0 0 300 150" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="150" cy="104" rx="150" ry="34" fill="url(#wd-g-lake)" />
      <path d="M20 104H280M50 114H250M80 123H220" className="wd-ripple" />
      <g transform="translate(18 0)">{swan}</g>
      <g transform="translate(282 0) scale(-1 1)">{swan}</g>
      <g opacity=".22" transform="translate(0 212) scale(1 -1)">
        <g transform="translate(18 0)">{swan}</g>
        <g transform="translate(282 0) scale(-1 1)">{swan}</g>
      </g>
      <path d="M2 100c4-18 2-32 6-44M10 102c0-14 4-24 2-34M290 100c-4-18-2-32-6-44M296 102c0-12-4-22-2-30" className="wd-reed" />
    </svg>
  );
}

/** Generic Mediterranean venue (viewBox 320×160): used until the couple adds a photo. */
export function Venue({ className }: P) {
  const windows = [];
  for (let i = 0; i < 6; i++) {
    const x = 64 + i * 30;
    windows.push(<path key={`u${i}`} d={`M${x} 62h12v14h-12z`} className="wd-venue-win" />);
    windows.push(<path key={`d${i}`} d={`M${x - 2} 112v-14a8 8 0 0 1 16 0v14z`} className="wd-venue-win" />);
  }
  return (
    <svg viewBox="0 0 320 160" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="160" cy="140" rx="158" ry="16" className="wd-venue-ground" />
      <path d="M50 46h196v86H50z" className="wd-venue-wall" />
      <path d="M42 48L60 30h176l18 18z" className="wd-venue-roof" />
      <path d="M50 86h196" className="wd-venue-line" />
      {windows}
      <path d="M140 132v-26a8 8 0 0 1 16 0v26" className="wd-venue-door" />
      <path d="M258 132c-6-30-2-70 6-96c8 26 12 66 6 96z" className="wd-venue-tree" />
      <path d="M278 132c-5-26-2-58 5-80c7 22 10 54 5 80z" className="wd-venue-tree" />
      <path d="M28 132c-2-14 0-20-4-26c-10 2-18-8-12-18c-6-10 6-20 16-14c6-8 20-4 20 6c10 2 12 14 4 20c2 8-6 14-14 12c-2 6 0 12-2 20z" className="wd-venue-olive" />
      <path d="M96 132h20M112 132l-2 6M100 132l-2 6M188 132h20M204 132l-2 6M192 132l-2 6" className="wd-venue-line" />
    </svg>
  );
}

const SKIN = ["#c98d6b", "#e2b493", "#8f5a3f", "#d6a07c", "#a86e4f"];

/** Guests dressed in the suggested colours (viewBox 300×190). Gowns take the palette; suits wear it as a tie. */
export function Outfits({ colors, className }: P & { colors: string[] }) {
  const pal = colors.length ? colors : ["#5b1727"];
  const figures: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const x = 34 + i * 58;
    const col = pal[i % pal.length]!;
    const skin = SKIN[i % SKIN.length]!;
    if (i % 2 === 0) {
      figures.push(
        <g key={i} transform={`translate(${x} 0)`}>
          <path d="M-9 26c0-12 18-12 18 0c0 6-2 10-2 16h-14c0-6-2-10-2-16z" className="wd-hair" />
          <circle cx="0" cy="30" r="9" fill={skin} />
          <path d="M-3 38h6v6h-6z" fill={skin} />
          <path d="M-9 46C-6 44 6 44 9 46L12 84C16 120 22 160 26 182H-26C-22 160-16 120-12 84Z" fill={col} />
          <path d="M-9 46L-14 74M9 46L14 74" stroke={skin} strokeWidth="4" strokeLinecap="round" />
          <path d="M-12 84C-4 88 4 88 12 84" className="wd-outfit-seam" />
        </g>,
      );
    } else {
      figures.push(
        <g key={i} transform={`translate(${x} 0)`}>
          <path d="M-9 22c2-6 16-6 18 0v6h-18z" className="wd-hair" />
          <circle cx="0" cy="28" r="9" fill={skin} />
          <path d="M-3 36h6v6h-6z" fill={skin} />
          <path d="M-15 46C-12 41 12 41 15 46L17 108H-17Z" className="wd-suit" />
          <path d="M-5 42L0 58L5 42Z" className="wd-shirt" />
          <path d="M-2 46h4l1 4-3 3-3-3z" fill={col} />
          <path d="M-5 42L-2 62L-9 52M5 42L2 62L9 52" className="wd-lapel" />
          <path d="M-14 108L-12 180H-2L0 118L2 180H12L14 108Z" className="wd-suit" />
          <path d="M-15 50L-19 104M15 50L19 104" className="wd-sleeve" />
          <path d="M-14 180h12v4h-14zM2 180h12l2 4H2z" className="wd-shoe" />
        </g>,
      );
    }
  }
  return (
    <svg viewBox="0 0 300 190" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="150" cy="184" rx="140" ry="5" className="wd-outfit-shadow" />
      {figures}
    </svg>
  );
}

/** Irregular wax blob around a circle of radius ≈ 44 (viewBox -50…50). */
const WAX =
  "M0-47C9-47 13-42 21-43C29-44 31-37 37-33C44-29 41-21 45-15C49-8 44-3 46 4C48 12 42 15 41 22C39 30 32 30 28 36C23 43 16 40 9 44C2 48-4 43-11 45C-19 47-22 40-29 37C-36 33-36 26-41 21C-46 15-43 8-46 1C-48-7-42-11-42-18C-42-26-35-28-31-34C-26-41-19-39-12-43C-6-47-4-47 0-47Z";

/** The seal on the envelope, with the couple's initials. Initials are text in JSX (escaped). */
export function WaxSeal({ initials, className, tone = "light" }: P & { initials: string; tone?: "light" | "deep" }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true" focusable="false">
      <path d={WAX} fill={tone === "light" ? "url(#wd-g-wax)" : "url(#wd-g-wax-deep)"} className="wd-wax" />
      <circle r="31" className={tone === "light" ? "wd-wax-ring" : "wd-wax-ring wd-wax-ring-deep"} />
      <circle r="27" className={tone === "light" ? "wd-wax-ring wd-wax-ring-in" : "wd-wax-ring wd-wax-ring-deep wd-wax-ring-in"} />
      <text y="9" textAnchor="middle" className={tone === "light" ? "wd-wax-text" : "wd-wax-text wd-wax-text-deep"} fontSize={initials.length > 3 ? 18 : 25}>
        {initials}
      </text>
    </svg>
  );
}

export function Petal({ className, style }: P) {
  return (
    <svg viewBox="0 0 20 24" className={className} style={style} aria-hidden="true" focusable="false">
      <path d="M10 1C17 6 19 14 15 20C12 24 8 24 5 20C1 14 3 6 10 1Z" className="wd-petal-float" />
      <path d="M10 4C9 10 9 16 10 22" className="wd-petal-vein" />
    </svg>
  );
}

/** Shared gradients and patterns, rendered once per page. */
export function ArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="wd-g-rose-shade">
          <stop offset="0" stopColor="#000" stopOpacity=".28" />
          <stop offset=".45" stopColor="#000" stopOpacity="0" />
          <stop offset=".9" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".12" />
        </radialGradient>
        <radialGradient id="wd-g-wax" cx=".38" cy=".32" r=".8">
          <stop offset="0" stopColor="#fff3ec" />
          <stop offset=".5" stopColor="#f2c9bb" />
          <stop offset="1" stopColor="#d79a8a" />
        </radialGradient>
        <radialGradient id="wd-g-wax-deep" cx=".38" cy=".32" r=".8">
          <stop offset="0" stopColor="#b33a52" />
          <stop offset=".55" stopColor="#7c1c30" />
          <stop offset="1" stopColor="#4a0d1b" />
        </radialGradient>
        <linearGradient id="wd-g-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="wd-stop-stone-1" />
          <stop offset="1" className="wd-stop-stone-2" />
        </linearGradient>
        <linearGradient id="wd-g-column" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" className="wd-stop-stone-2" />
          <stop offset=".5" className="wd-stop-stone-1" />
          <stop offset="1" className="wd-stop-stone-2" />
        </linearGradient>
        <linearGradient id="wd-g-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="wd-stop-lake-1" />
          <stop offset="1" className="wd-stop-lake-2" />
        </linearGradient>
        <pattern id="wd-p-jali" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M9 0L18 9L9 18L0 9Z" className="wd-jali" />
          <circle cx="9" cy="9" r="2.2" className="wd-jali" />
        </pattern>
      </defs>
    </svg>
  );
}

/**
 * Embossed damask for the envelope (one 160×160 tile, drawn three times: highlight, shadow
 * and body) — a pressed-paper look without filters or images.
 */
export function EmbossTile() {
  const rose = (x: number, y: number, s: number, r: number) => (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {ROSE.map((p, i) => (
        <path key={i} d={p.d} />
      ))}
    </g>
  );
  const leaf = (x: number, y: number, r: number, s: number) => (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0C10-8 13-26 0-42C-13-26-10-8 0 0ZM0-4V-36M0-14l6-7M0-22l-6-7" />
    </g>
  );
  // Half-drop repeat: two big roses per 160×160 tile, trailing leaves and stems between them.
  const motif = (
    <g>
      {rose(44, 46, 0.62, 12)}
      {rose(124, 126, 0.52, -30)}
      {rose(124, -34, 0.52, -30)}
      {rose(-36, 126, 0.52, -30)}
      {rose(204, 46, 0.62, 12)}
      {leaf(70, 80, 140, 0.9)}
      {leaf(20, 84, 210, 0.8)}
      {leaf(92, 40, 70, 0.75)}
      {leaf(150, 92, 30, 0.8)}
      {leaf(100, 150, 230, 0.7)}
      {leaf(150, 158, 110, 0.7)}
      <path d="M62 74c18 16 30 26 44 40M18 78c-8 18-12 30-10 48M96 160c4-10 10-18 20-22" />
    </g>
  );
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="wd-p-emboss" width="160" height="160" patternUnits="userSpaceOnUse">
          <g className="wd-emboss-hi" transform="translate(-0.8 -0.8)">{motif}</g>
          <g className="wd-emboss-lo" transform="translate(1 1)">{motif}</g>
          <g className="wd-emboss-body">{motif}</g>
        </pattern>
      </defs>
    </svg>
  );
}
