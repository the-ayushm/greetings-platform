/*
 * Rudra & Gauri — wedding invitation ("gaurishankar" template).
 * Re-implementation of the original Next.js/React + framer-motion page in plain JS.
 * Every class name, colour, timing and easing below was recovered from the original
 * production bundle; the compiled stylesheet (css/aavjoo.css) is the original one.
 */
(function () {
  'use strict';
  const D = window.INVITE;
  const S = window.STRINGS;
  const M = window.Motion;
  // ?demo in the URL reproduces the original "demo invitation" RSVP behaviour (notice instead of WhatsApp)
  if (new URLSearchParams(location.search).has('demo')) D.rsvp.demo = true;

  /* ------------------------------------------------------------------ */
  /* constants (from the original template)                              */
  /* ------------------------------------------------------------------ */
  const IMG = 'assets/illus';
  const INK = '#36101c'; // tg
  const ACCENT = '#9a1d45'; // tb
  const DEEP = '#741225'; // tj
  const GOLD = '#6c4a0c'; // ty
  const LINE = '#b8862f'; // tq
  const SOFT = '#55303b'; // tv
  const BLUSH = '#f3dce4'; // tk
  const PAPER = '#fbf4f1';
  const SHADOW = '0 0 14px rgba(255,250,252,.95), 0 0 3px rgba(255,250,252,.9)'; // tN
  const EASE = [0.22, 1, 0.36, 1]; // t$
  const OPENING_MS = 6200;
  const TAP_HINT_DELAY = 7.5;
  const tL = (n) => `calc(min(1cqw, 0.5svh) * ${n})`;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // theme UI classes (base theme + gaurishankar overrides)
  const UI = {
    section: 'relative px-[10cqw] py-[12cqw]',
    card: 'rounded-[4cqw] border border-black/10 bg-white/80 backdrop-blur-sm',
    input: 'w-full rounded-[2.5cqw] border border-black/15 bg-white/90 px-[4cqw] py-[3cqw] text-[3.8cqw] outline-none placeholder:opacity-40 placeholder:!opacity-60',
    chip: 'rounded-full border border-black/15 bg-white/70 transition',
    chipOn: 'rounded-full border border-transparent font-semibold text-white transition [background:var(--inv-accent)]',
    button: 'inline-flex items-center gap-[1.5cqw] rounded-full px-[4.5cqw] py-[2.4cqw] text-[3.2cqw] font-semibold text-white active:scale-95 transition [background:var(--inv-accent)]',
    ghost: 'inline-flex items-center gap-[1.5cqw] rounded-full border border-current/30 px-[4.5cqw] py-[2.4cqw] text-[3.2cqw] active:scale-95 transition',
    muted: 'font-medium',
    tile: 'rounded-[3cqw] border border-black/10 bg-white/80 backdrop-blur-sm',
  };
  const PILL =
    'pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-full bg-[rgba(24,14,10,.74)] px-5 py-3 text-[clamp(14px,3.9cqw,17px)] font-semibold tracking-[0.01em] text-white shadow-[0_6px_24px_rgba(0,0,0,.35)] ring-1 ring-white/25 backdrop-blur-md';

  /* ------------------------------------------------------------------ */
  /* tiny DOM helper                                                     */
  /* ------------------------------------------------------------------ */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_TAGS = new Set(['svg', 'path', 'circle', 'ellipse', 'g', 'rect', 'line']);
  function h(tag, props, ...kids) {
    const el = SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.setAttribute('class', v);
        else if (k === 'style') {
          if (typeof v === 'string') el.style.cssText = v;
          else for (const s in v) s.startsWith('--') ? el.style.setProperty(s, v[s]) : (el.style[s] = v[s]);
        } else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    add(el, kids);
    return el;
  }
  function add(el, kids) {
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false || c === '') continue;
      el.append(c instanceof Node ? c : String(c));
    }
    return el;
  }
  const FILL = 'position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent';
  const img = (src, { alt = '', contain = false, priority = false } = {}) =>
    h('img', { alt, src, decoding: 'async', loading: priority ? null : 'lazy', class: contain ? 'object-contain' : 'object-cover', style: FILL });

  /* ------------------------------------------------------------------ */
  /* formatting (Asia/Kolkata, en-IN — same as the original)            */
  /* ------------------------------------------------------------------ */
  const fmt = (d, o) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...o }).format(new Date(d));
  const F = {
    weekday: (d) => fmt(d, { weekday: 'long' }),
    day: (d) => fmt(d, { day: 'numeric' }),
    month: (d) => fmt(d, { month: 'long' }),
    year: (d) => fmt(d, { year: 'numeric' }),
    long: (d) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    dayMonthYear: (d) => fmt(d, { day: 'numeric', month: 'long', year: 'numeric' }),
    monthYear: (d) => fmt(d, { month: 'long', year: 'numeric' }),
    time: (d) => fmt(d, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
  };
  const [LEAD, OTHER] = D.lead === 'bride' ? [D.bride, D.groom] : [D.groom, D.bride];

  /* links (identical URL building to the original) */
  const location_ = (e) => [e.venue, e.address || D.city].filter(Boolean).join(', ');
  const mapUrl = (e) => e.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location_(e))}`;
  const gcalStamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  function calendarUrl(e) {
    const s = new Date(e.start);
    const end = new Date(e.end || s.getTime() + 108e5);
    const q = new URLSearchParams({ action: 'TEMPLATE', text: `${e.name} · ${LEAD.first} & ${OTHER.first}`, dates: `${gcalStamp(s)}/${gcalStamp(end)}`, location: location_(e) });
    return `https://calendar.google.com/calendar/render?${q}`;
  }

  /* ------------------------------------------------------------------ */
  /* shared pieces                                                       */
  /* ------------------------------------------------------------------ */
  const LOTUS = 'M12 19c-3-1.5-5-4-5-7 2 0 4 1 5 3 1-2 3-3 5-3 0 3-2 5.5-5 7zM12 15c-1.6-2-1.6-5 0-8 1.6 3 1.6 6 0 8zM4 13c1.5 0 3 .6 4 2M20 13c-1.5 0-3 .6-4 2';
  const Divider = (cls = '') =>
    h('div', { class: `flex items-center justify-center gap-[2.5cqw] ${cls}` },
      h('span', { class: 'h-px w-[16cqw]', style: `background:linear-gradient(to right, transparent, ${LINE})` }),
      h('svg', { viewBox: '0 0 24 24', class: 'w-[5cqw]', fill: 'none', stroke: LINE, 'stroke-width': '1.3', 'aria-hidden': 'true' }, h('path', { d: LOTUS })),
      h('span', { class: 'h-px w-[16cqw]', style: `background:linear-gradient(to left, transparent, ${LINE})` }));

  const Title = (kicker, title) =>
    h('div', { class: 'text-center' },
      kicker && h('p', { class: 'inv-label text-[2.8cqw] font-semibold', style: { color: GOLD, textShadow: SHADOW } }, kicker),
      h('h2', { class: 'inv-script mt-[1cqw] text-[11cqw] leading-[1.1]', style: { color: ACCENT, textShadow: SHADOW } }, title),
      Divider('mt-[1.5cqw]'));

  // scroll reveal wrapper (original module "b": opacity 0 / y 28 → in view)
  function Reveal(kids, { delay = 0, y = 28, cls = null } = {}) {
    const el = add(h('div', { class: cls }), [kids]);
    M.set(el, { opacity: 0, y });
    M.inView(el, () => M.animate(el, { opacity: 1, y: 0 }, { duration: 0.9, delay, ease: EASE }), { amount: 0.25 });
    return el;
  }

  // falling petals (tF)
  const PETALS = [
    { x: 8, d: 0, s: 1, t: 9 }, { x: 22, d: 2.4, s: 0.8, t: 11 }, { x: 37, d: 1.1, s: 1.15, t: 10 },
    { x: 51, d: 3.6, s: 0.7, t: 12 }, { x: 64, d: 0.6, s: 0.95, t: 9.5 }, { x: 78, d: 2.9, s: 1.1, t: 10.5 },
    { x: 90, d: 1.7, s: 0.85, t: 11.5 }, { x: 15, d: 5.2, s: 0.75, t: 12.5 }, { x: 45, d: 6.1, s: 1, t: 10 },
    { x: 71, d: 4.4, s: 0.9, t: 11 },
  ];
  function Petals() {
    if (reduced) return null;
    return h('div', { 'aria-hidden': 'true', class: 'pointer-events-none absolute inset-0 overflow-hidden' },
      PETALS.map((p, i) => {
        const svg = h('svg', { viewBox: '0 0 20 14', class: 'absolute -top-[6%]', style: { left: `${p.x}%`, width: `${3.4 * p.s}cqw` } },
          h('path', { d: 'M1 7C4 1 13 0 19 7 13 14 4 13 1 7z', fill: i % 3 ? '#f2a3b5' : '#e77f98', opacity: '0.85' }));
        M.set(svg, { y: '-10%', opacity: 0 });
        M.animate(svg, { y: ['0vh', '112vh'], x: ['0cqw', '5cqw', '-3cqw', '4cqw'], rotate: [0, 120, 220, 340], opacity: [0, 0.9, 0.9, 0] },
          { duration: p.t, delay: p.d, repeat: Infinity, ease: 'linear' });
        return svg;
      }));
  }

  // optical horizontal centring of script names (tw)
  let measureCtx = null;
  const ctx2d = () => (measureCtx ||= document.createElement('canvas').getContext('2d'));
  function Centred(text, nudge = 0) {
    const span = h('span', { style: 'display:inline-block' }, text);
    const run = () => {
      const s = getComputedStyle(span);
      const c = ctx2d();
      c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const m = c.measureText(text);
      let off = m.width / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
      if (Math.abs(off) < 0.5) off = 0;
      span.style.transform = off || nudge ? `translate(calc(${off.toFixed(1)}px + ${nudge}em), 0px)` : '';
    };
    requestAnimationFrame(run);
    document.fonts && document.fonts.ready.then(run);
    new ResizeObserver(run).observe(span);
    return span;
  }

  /* ------------------------------------------------------------------ */
  /* Opening (tap-to-open cover)                                         */
  /* ------------------------------------------------------------------ */
  function Opening(onOpen) {
    const r = (n) => (reduced ? 0 : n);
    const hand = h('div', { class: 'absolute', style: { left: tL(-12), top: tL(68), width: tL(112), aspectRatio: '1100 / 618' } },
      img(`${IMG}/shiv-hand.webp`, { contain: true, priority: true }));
    const step = h('div', { class: 'absolute', style: { top: tL(-8), right: `min(calc(100cqw - ${tL(130)}), 0px)`, width: tL(90), aspectRatio: '788 / 890' } },
      img(`${IMG}/shiv-parvati-step.webp`, { contain: true, priority: true }));
    const glow = h('div', {
      'aria-hidden': 'true', class: 'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full',
      style: { left: tL(62), top: tL(78), width: tL(54), height: tL(54), background: 'radial-gradient(closest-side, rgba(255,240,230,.9), rgba(255,220,225,0))' },
    });
    const line = h('p', { class: 'inv-label relative leading-snug font-bold', style: { fontSize: tL(4.8), color: DEEP, textShadow: SHADOW, letterSpacing: '0.06em' } },
      S.openingLine[0], h('br'), S.openingLine[1]);
    const names = h('p', { class: 'inv-script relative leading-[1.15]', style: { fontSize: tL(15), marginTop: tL(2), color: ACCENT, textShadow: SHADOW } },
      LEAD.first, ' ', h('span', { style: { fontSize: tL(10) } }, D.joiner || '&'), ' ', OTHER.first);

    const btn = h('button', { type: 'button', 'aria-label': 'Open invitation', class: 'absolute inset-0 block cursor-pointer overflow-hidden text-left', style: { background: BLUSH } },
      img(`${IMG}/shiv-sky.jpg`, { priority: true }),
      Petals(),
      hand, step, glow,
      h('div', { class: 'absolute inset-x-[4%] text-center', style: { top: tL(132) } },
        h('div', { 'aria-hidden': 'true', class: 'absolute -inset-x-[6%] -inset-y-[18%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,248,250,.78),rgba(255,248,250,0))]' }),
        line, names));
    btn.addEventListener('click', onOpen);

    if (!reduced) {
      M.set(hand, { x: '-100%', opacity: 0 });
      M.set(step, { x: '35%', y: '-35%', opacity: 0 });
    }
    M.animate(hand, { x: '0%', opacity: 1 }, { duration: 2, delay: r(0.2), ease: 'easeOut' });
    M.animate(step, { x: '0%', y: '0%', opacity: 1 }, { duration: 2.6, delay: r(1), ease: [0.25, 0.8, 0.3, 1] });
    M.set(glow, { opacity: 0, scale: 0.4 });
    M.animate(glow, { opacity: [0, 0.95, 0.4], scale: [0.4, 1.2, 1] }, { duration: 2.2, delay: r(3.4), ease: EASE });
    M.set(line, { opacity: 0, y: 12 });
    M.animate(line, { opacity: 1, y: 0 }, { duration: 1.1, delay: r(4), ease: EASE });
    M.set(names, { opacity: 0, y: 14, filter: 'blur(6px)' });
    M.animate(names, { opacity: 1, y: 0, filter: 'blur(0px)' }, { duration: 1.4, delay: r(4.8), ease: EASE });

    btn.opened = () => {
      btn.style.pointerEvents = 'none';
      M.animate(btn, { opacity: 0, scale: 1.06 }, { duration: 1.3, ease: EASE });
    };
    return btn;
  }

  function TapHint(onOpen) {
    const hand = h('span', { 'aria-hidden': 'true', class: 'text-[1.15em] leading-none' }, '👆');
    const btn = h('button', { type: 'button', class: PILL }, hand, S.tapAnywhere);
    btn.addEventListener('click', onOpen);
    M.set(btn, { opacity: 0, y: 12 });
    M.animate(btn, { opacity: 1, y: [0, -4, 0] }, {
      opacity: { delay: TAP_HINT_DELAY, duration: 0.5 },
      y: { delay: TAP_HINT_DELAY + 0.4, duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    });
    M.animate(hand, { scale: [1, 0.82, 1] }, { duration: 1.2, repeat: Infinity, ease: 'easeInOut' });
    const wrap = h('div', { class: 'pointer-events-none absolute inset-x-0 bottom-[max(7%,calc(env(safe-area-inset-bottom)+20px))] z-20 flex justify-center px-4' }, btn);
    wrap.opened = () => M.animate(btn, { opacity: 0, y: 12 }, { duration: 0.25 });
    return wrap;
  }

  /* ------------------------------------------------------------------ */
  /* Hero (sticky Kailash scene, 210dvh)                                 */
  /* ------------------------------------------------------------------ */
  function HeroText() {
    const shown = [];
    const show = (el, delay) => { M.set(el, { opacity: 0, y: 12 }); shown.push([el, delay]); return el; };
    const st = (color, extra) => Object.assign({ color, textShadow: SHADOW }, extra);
    const el = h('div', { class: 'relative flex flex-col items-center text-center' },
      h('div', { class: 'absolute -inset-x-[10%] -inset-y-[18%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,250,248,.9),rgba(255,250,248,0))]' }),
      show(h('p', { class: 'relative text-[3.6cqw] leading-snug font-semibold', style: st(DEEP, { fontFamily: 'var(--font-deva)' }) }, D.invocation), 0.2),
      D.invocationMeaning && show(h('p', { class: 'inv-serif relative mt-[1cqw] text-[4cqw] font-semibold italic', style: st(SOFT) }, D.invocationMeaning), 0.35),
      show(h('p', { class: 'inv-label relative mt-[3cqw] text-[2.8cqw] leading-relaxed font-semibold', style: st(INK) }, D.heroKicker || S.heroKicker), 0.5),
      show(h('h1', { class: 'inv-script relative mt-[1.5cqw] text-[14cqw] leading-[1.05]', style: st(ACCENT) },
        LEAD.first, h('span', { class: 'mx-[2cqw] text-[9cqw]' }, D.joiner || '&'), OTHER.first), 0.75),
      !D.hideHeroDate && show(h('p', { class: 'inv-label relative mt-[3cqw] text-[3.4cqw] font-bold', style: st(DEEP, { letterSpacing: '0.1em' }) },
        `${F.weekday(D.date)} · ${F.day(D.date)} ${F.month(D.date)} ${F.year(D.date)}`), 1),
      !D.hideHeroCity && show(h('p', { class: 'inv-serif relative mt-[1.5cqw] text-[4.8cqw] font-semibold italic', style: st(INK) }, D.city), 1.15));
    el.opened = () => shown.forEach(([e, d]) => M.animate(e, { opacity: 1, y: 0 }, { duration: 1, delay: d, ease: EASE }));
    return el;
  }

  function Hero() {
    const zoom = h('div', { class: 'absolute inset-0', style: { transformOrigin: '50% 66%' } },
      img(`${IMG}/shiv-kailash.jpg`, { alt: `Shiv and Parvati seated together on Kailash, for ${LEAD.first} and ${OTHER.first}`, priority: true }));
    const clouds = h('div', {
      'aria-hidden': 'true', class: 'pointer-events-none absolute inset-x-[-20%] bottom-0 h-[20%]',
      style: { background: 'radial-gradient(60% 70% at 30% 100%, rgba(255,255,255,.8), transparent 70%), radial-gradient(60% 70% at 75% 100%, rgba(255,255,255,.7), transparent 70%)' },
    });
    M.animate(clouds, { x: ['-4%', '4%', '-4%'] }, { duration: 14, repeat: Infinity, ease: 'easeInOut' });
    const text = HeroText();
    const textWrap = h('div', { class: 'absolute inset-x-[7%] top-[6%]' }, text);
    const sticky = h('div', { class: 'sticky top-0 h-[100dvh] w-full overflow-hidden' }, zoom, Petals(), clouds, textWrap);
    const section = h('section', { class: 'relative', style: { height: '210dvh' } }, sticky);
    section.opened = text.opened;
    section.update = (scroller) => {
      const n = M.scrollProgress(scroller, section, ['start start', 'end end']);
      M.set(zoom, { scale: M.transform(n, [0, 0.95], [1, 1.8]) });
      M.set(textWrap, { y: M.transform(n, [0, 0.3], ['0%', '-40%']), opacity: M.transform(n, [0.03, 0.26], [1, 0]) });
      M.set(sticky, { opacity: M.transform(n, [0.66, 0.98], [1, 0]) });
    };
    return section;
  }

  /* ------------------------------------------------------------------ */
  /* Blessing (families)                                                 */
  /* ------------------------------------------------------------------ */
  function Blessing() {
    const st = (color, extra) => Object.assign({ color, textShadow: SHADOW }, extra);
    const person = (p) =>
      h('div', null,
        h('p', { class: 'inv-script mt-[1.5cqw] text-[14cqw] leading-[1.05]', style: st(ACCENT) }, Centred(p.full || p.first)),
        p.parents && h('p', { class: 'inv-serif mx-auto mt-[1cqw] max-w-[70cqw] text-[4.2cqw] leading-snug font-semibold italic', style: st(SOFT) }, p.parents));
    const inner = h('div', { style: { transformOrigin: '50% 30%' } },
      h('p', { class: 'text-[9cqw] leading-none', style: st(GOLD, { fontFamily: 'var(--font-deva)' }) }, 'ॐ'),
      h('p', { class: 'inv-label mt-[4cqw] text-[3cqw] leading-relaxed font-semibold', style: st(GOLD) }, D.hosts || S.togetherWithFamilies),
      h('p', { class: 'inv-serif mt-[2.5cqw] text-[5cqw] leading-snug font-semibold italic', style: st(INK) }, D.message),
      Divider('my-[6cqw]'),
      person(LEAD),
      h('p', { class: 'my-[3cqw] text-[9cqw] leading-none', style: st(GOLD, { fontFamily: 'var(--font-parisienne), cursive' }) }, S.with),
      person(OTHER));
    const section = h('section', { class: 'relative z-10 px-[11cqw] pb-[10cqw] text-center -mt-[55dvh] pt-[20cqw]' }, inner);
    section.update = (scroller) => {
      const p = M.scrollProgress(scroller, section, ['start end', 'start 15%']);
      M.set(inner, { scale: M.transform(p, [0, 1], [0.5, 1]), opacity: M.transform(p, [0, 0.45], [0, 1]) });
    };
    return section;
  }

  /* ------------------------------------------------------------------ */
  /* Save the date — scratch card                                        */
  /* ------------------------------------------------------------------ */
  const CONFETTI_COLORS = ['#f2b8c0', '#e98aa3', '#fbe1dc', '#f4a6a0', '#c2456b'];
  const r2 = (n) => Math.round(100 * n) / 100;
  function ring(r, n, bulge) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
      if (i === 0) s += `M${r2(Math.cos(a0) * r)} ${r2(Math.sin(a0) * r)}`;
      s += ` Q${r2(Math.cos(am) * (r + bulge))} ${r2(Math.sin(am) * (r + bulge))} ${r2(Math.cos(a1) * r)} ${r2(Math.sin(a1) * r)}`;
    }
    return s + ' Z';
  }
  function Marigold(r, hue) {
    const c = hue === 'orange' ? ['#d9620b', '#f08419', '#f9a531'] : ['#e59a07', '#f6b819', '#fdd54a'];
    return h('g', { transform: 'translate(0 0)' },
      h('path', { d: ring(0.85 * r, 14, 0.22 * r), fill: c[0] }),
      h('path', { d: ring(0.62 * r, 12, 0.2 * r), fill: c[1], transform: 'rotate(12)' }),
      h('path', { d: ring(0.38 * r, 9, 0.16 * r), fill: c[2], transform: 'rotate(5)' }),
      h('circle', { r: 0.14 * r, fill: c[0], opacity: '0.6' }));
  }
  function ConfettiPiece(kind, color) {
    if (kind === 'marigold')
      return h('svg', { viewBox: '-12 -12 24 24', class: 'h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,.2)]' }, Marigold(11, color === 'yellow' ? 'yellow' : 'orange'));
    if (kind === 'jasmine')
      return h('svg', { viewBox: '-12 -12 24 24', class: 'h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,.18)]' },
        [0, 72, 144, 216, 288].map((a) => h('ellipse', { cx: '0', cy: '-6', rx: '3.6', ry: '6', fill: '#fffdf6', transform: `rotate(${a})` })),
        h('circle', { r: '2.4', fill: '#f1d77a' }));
    return h('svg', { viewBox: '0 0 20 20', class: 'h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,.15)]', 'aria-hidden': 'true' },
      h('path', { d: 'M10 1 C16 4 18 12 10 19 C2 12 4 4 10 1 Z', fill: color }),
      h('path', { d: 'M10 3 C11 8 11 13 10 17', stroke: '#ffffff', 'stroke-opacity': '0.5', 'stroke-width': '0.6', fill: 'none' }));
  }
  function Confetti(from) {
    const rnd = M.prng(23);
    const vh = window.innerHeight;
    const layer = h('div', { class: 'pointer-events-none fixed inset-0 z-[80] overflow-hidden', 'aria-hidden': 'true' });
    for (let n = 0; n < 70; n++) {
      const kind = n % 5 === 0 ? 'marigold' : n % 7 === 0 ? 'jasmine' : 'petal';
      const a = rnd() * Math.PI * 2;
      const s = 90 + 220 * rnd();
      const color = kind === 'marigold' ? (rnd() > 0.5 ? 'yellow' : 'orange') : CONFETTI_COLORS[n % CONFETTI_COLORS.length];
      const size = kind === 'petal' ? 12 + 12 * rnd() : 18 + 12 * rnd();
      const bx = Math.cos(a) * s, by = Math.sin(a) * s * 0.7 - 160 - 140 * rnd();
      const fx = (rnd() - 0.5) * 160;
      const spin = (rnd() > 0.5 ? 1 : -1) * (240 + 480 * rnd());
      const delay = 0.25 * rnd(), dur = 3.4 + 2.4 * rnd();
      const el = h('div', { class: 'absolute', style: { left: `${from.x - size / 2}px`, top: `${from.y - size / 2}px`, width: `${size}px`, height: `${size}px` } }, ConfettiPiece(kind, color));
      M.set(el, { x: 0, y: 0, scale: 0.3, opacity: 0, rotate: 0 });
      M.animate(el, { x: [0, bx, bx + fx], y: [0, by, vh - from.y + 80], scale: [0.3, 1, 1], opacity: [0, 1, 1], rotate: [0, 0.3 * spin, spin] },
        { duration: dur, delay, times: [0, 0.18, 1], ease: ['easeOut', 'easeIn'] });
      layer.append(el);
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), 6500);
  }

  function ScratchSection() {
    let revealed = false;
    let drawing = false;
    let last = null;
    const canvas = h('canvas', { class: 'absolute inset-0 h-full w-full cursor-grab touch-none rounded-[inherit] active:cursor-grabbing', 'aria-label': S.scratchAria, role: 'img' });
    const card = h('div', { class: `${UI.card} relative mt-[8cqw] overflow-visible` },
      h('div', { class: 'flex flex-col items-center px-[6cqw] py-[9cqw] text-center' },
        h('p', { class: 'inv-label text-[2.8cqw] opacity-70' }, F.weekday(D.date)),
        h('p', { class: 'inv-serif mt-[2cqw] text-[18cqw] leading-none' }, F.day(D.date)),
        h('p', { class: 'inv-label mt-[2cqw] text-[3.4cqw]' }, `${F.month(D.date)} · ${F.year(D.date)}`),
        h('p', { class: 'inv-serif mt-[3cqw] text-[3.8cqw] italic opacity-80' }, D.city)),
      canvas);
    const instead = h('button', { type: 'button', class: `mx-auto mt-[4cqw] block text-[3.2cqw] underline underline-offset-4 ${UI.muted}` }, S.revealInstead);

    function paint() {
      if (revealed) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = card.clientWidth * dpr;
      canvas.height = card.clientHeight * dpr;
      const c = canvas.getContext('2d');
      const w = canvas.width, hh = canvas.height;
      const g = c.createLinearGradient(0, 0, w, hh);
      g.addColorStop(0, '#b8862e'); g.addColorStop(0.3, '#f3d98a'); g.addColorStop(0.5, '#c99a3c'); g.addColorStop(0.72, '#f7e3a3'); g.addColorStop(1, '#a9782a');
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = g;
      c.fillRect(0, 0, w, hh);
      const rnd = M.prng(7);
      for (let i = 0; i < 260; i++) {
        c.fillStyle = `rgba(255,255,255,${0.15 + 0.45 * rnd()})`;
        c.fillRect(rnd() * w, rnd() * hh, dpr * (0.6 + rnd()), dpr * (0.6 + rnd()));
      }
      c.strokeStyle = 'rgba(120,80,20,.35)';
      c.lineWidth = dpr;
      c.setLineDash([4 * dpr, 4 * dpr]);
      c.strokeRect(8 * dpr, 8 * dpr, w - 16 * dpr, hh - 16 * dpr);
      c.setLineDash([]);
      c.fillStyle = 'rgba(90,55,10,.85)';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `600 ${Math.round(13 * dpr)}px Georgia, serif`;
      c.fillText(S.scratchFoil, w / 2, hh / 2);
    }
    function reveal() {
      if (revealed) return;
      revealed = true;
      const r = card.getBoundingClientRect();
      Confetti(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 });
      instead.remove();
      M.animate(canvas, { opacity: 0, scale: 1.04 }, { duration: 0.6 }).then(() => canvas.remove());
    }
    function scratch(e) {
      if (!drawing || revealed) return;
      const c = canvas.getContext('2d');
      const r = canvas.getBoundingClientRect();
      const k = canvas.width / r.width;
      const p = { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
      c.globalCompositeOperation = 'destination-out';
      c.strokeStyle = '#000';
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.lineWidth = 34 * k;
      c.beginPath();
      const from = last || p;
      c.moveTo(from.x, from.y);
      c.lineTo(p.x, p.y);
      c.stroke();
      last = p;
    }
    function cleared() {
      const c = canvas.getContext('2d');
      const { data } = c.getImageData(0, 0, canvas.width, canvas.height);
      let clear = 0, n = 0;
      for (let i = 3; i < data.length; i += 96) { n++; if (data[i] < 40) clear++; }
      return clear / n;
    }
    function end() {
      drawing = false;
      last = null;
      if (!revealed && cleared() > 0.5) reveal();
    }
    canvas.addEventListener('pointerdown', (e) => { drawing = true; canvas.setPointerCapture(e.pointerId); scratch(e); });
    canvas.addEventListener('pointermove', scratch);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    instead.addEventListener('click', reveal);
    new ResizeObserver(() => !revealed && paint()).observe(card);
    requestAnimationFrame(paint);

    return h('section', { class: UI.section },
      Reveal(Title(S.scratchKicker, S.scratchTitle)),
      Reveal([card, instead], { delay: 0.1 }));
  }

  /* ------------------------------------------------------------------ */
  /* Countdown                                                           */
  /* ------------------------------------------------------------------ */
  function CountdownSection() {
    const target = new Date(D.date).getTime();
    const nums = S.units.map(() => h('span', { class: 'inv-serif text-[9cqw] leading-none tabular-nums' }, '--'));
    const grid = h('div', { class: 'mt-8 grid grid-cols-4 gap-[2.5cqw]' },
      S.units.map((u, i) => h('div', { class: `${UI.tile} flex aspect-[4/5] flex-col items-center justify-center` },
        nums[i], h('span', { class: 'inv-label mt-[2cqw] text-[2.2cqw] opacity-70' }, u))));
    const done = h('p', { class: 'inv-script mt-6 text-center text-[11cqw]' }, S.justMarried);
    const tick = () => {
      const t = Math.max(0, target - Date.now());
      if (t === 0) { if (grid.isConnected) grid.replaceWith(done); return; }
      [Math.floor(t / 864e5), Math.floor((t / 36e5) % 24), Math.floor((t / 6e4) % 60), Math.floor((t / 1e3) % 60)]
        .forEach((v, i) => (nums[i].textContent = String(v).padStart(2, '0')));
    };
    setTimeout(tick, 0);
    setInterval(tick, 1000);
    return h('section', { class: UI.section },
      Reveal([
        Title(S.countdownKicker, D.countdownTitle || S.countdownTitle),
        grid,
        h('p', { class: `mt-6 text-center text-[3.6cqw] ${UI.muted}` }, F.long(D.date), D.hideCountdownCity ? '' : ` · ${D.city}`),
      ]));
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */
  const PIN = () => h('svg', { viewBox: '0 0 24 24', class: 'size-[1.1em]', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'aria-hidden': 'true' },
    h('path', { d: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z' }), h('circle', { cx: '12', cy: '9.5', r: '2.5' }));
  const CAL = () => h('svg', { viewBox: '0 0 24 24', class: 'size-[1.1em]', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'aria-hidden': 'true' },
    h('rect', { x: '3', y: '5', width: '18', height: '16', rx: '2' }), h('path', { d: 'M3 10h18M8 3v4M16 3v4' }));
  const WA = () => h('svg', { viewBox: '0 0 24 24', class: 'size-[1.2em]', fill: 'currentColor', 'aria-hidden': 'true' },
    h('path', { d: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z' }));

  function EventActions(e) {
    return h('div', { 'data-event-actions': 'true', class: 'mt-[5cqw] flex flex-wrap justify-center gap-[2.5cqw]' },
      (e.mapUrl || !D.noMapSearch) && h('a', { href: mapUrl(e), target: '_blank', rel: 'noreferrer', class: UI.button }, PIN(), ' ', S.directions),
      h('a', { href: calendarUrl(e), target: '_blank', rel: 'noreferrer', class: UI.ghost }, CAL(), ' ', S.saveDate));
  }

  function EventCard(e) {
    const om = D.eventOm ? (D.eventOm === 'gold' ? `${IMG}/shiv-om-gold.webp` : `${IMG}/shiv-om-maroon.webp`) : null;
    return h('div', null,
      h('div', { class: 'relative mx-auto w-[78cqw] drop-shadow-[0_12px_20px_rgba(140,40,70,.14)]', style: { aspectRatio: '774 / 1442' } },
        img(`${IMG}/shiv-card.webp`, { contain: true }),
        om && h('div', { class: 'pointer-events-none absolute inset-x-0 top-[14.5%] flex justify-center' },
          h('div', { class: 'relative aspect-[653/573] w-[12%]' }, img(om, { alt: 'Om', contain: true }))),
        h('div', { class: 'absolute inset-x-[15%] top-[25%] bottom-[15%] flex flex-col items-center justify-center text-center' },
          h('h3', { class: 'inv-script text-[13cqw] leading-[1.05]', style: { color: ACCENT } }, e.name),
          e.note && h('p', { class: 'inv-serif mt-[1.5cqw] text-[3.9cqw] leading-snug font-semibold italic', style: { color: SOFT } }, e.note),
          Divider('my-[4cqw]'),
          h('p', { class: 'inv-label text-[3.6cqw] leading-snug font-bold', style: { color: DEEP, letterSpacing: '0.08em' } }, F.weekday(e.start)),
          h('p', { class: 'mt-[1cqw] text-[10cqw] leading-none font-semibold', style: { color: INK, fontFamily: 'var(--font-cormorant), serif' } }, F.day(e.start)),
          h('p', { class: 'inv-label mt-[1cqw] text-[3.4cqw] leading-snug font-bold', style: { color: DEEP, letterSpacing: '0.08em' } },
            F.monthYear(e.start), !e.noTime && ` · ${e.timeText || F.time(e.start)}`),
          h('p', { class: 'inv-serif mt-[5cqw] text-[4.8cqw] leading-tight font-bold', style: { color: INK } }, e.venue),
          e.address && h('p', { class: 'inv-serif mt-[1cqw] line-clamp-3 text-[3.6cqw] leading-snug font-medium', style: { color: SOFT, textWrap: 'balance' } }, e.address),
          e.dress && h('p', { class: 'inv-serif mt-[2.5cqw] text-[3.8cqw] font-semibold italic', style: { color: ACCENT } }, S.dress(e.dress)))),
      h('div', { class: 'mt-[3cqw] flex justify-center' }, EventActions(e)));
  }

  function EventsSection() {
    return h('section', { class: 'relative px-[11cqw] py-[12cqw]' },
      Reveal(Title(S.eventsKicker, S.eventsTitle)),
      h('ol', { class: 'mt-[8cqw] space-y-[9cqw]' },
        D.events.map((e) => {
          const li = h('li', null, EventCard(e));
          M.set(li, { opacity: 0, y: 30, scale: 0.94 });
          M.inView(li, () => M.animate(li, { opacity: 1, y: 0, scale: 1 }, { duration: 0.9, ease: EASE }), { amount: 0.3 });
          return li;
        })));
  }

  /* ------------------------------------------------------------------ */
  /* Gallery + lightbox                                                  */
  /* ------------------------------------------------------------------ */
  const TILT = [-3, 2.5, -1.5, 3, -2.5, 1.5, -3, 2];
  function GallerySection() {
    const pics = D.gallery || [];
    if (!pics.length) return null;
    let section;
    const dots = pics.map((_, n) => h('span', { class: `h-[1.4cqw] rounded-full bg-current transition-all ${n === 0 ? 'w-[5cqw] opacity-80' : 'w-[1.4cqw] opacity-25'}` }));
    const setDot = (i) => dots.forEach((d, n) => d.setAttribute('class', `h-[1.4cqw] rounded-full bg-current transition-all ${n === i ? 'w-[5cqw] opacity-80' : 'w-[1.4cqw] opacity-25'}`));
    const strip = h('div', { class: 'no-scrollbar mt-[8cqw] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[19cqw] pt-[3cqw] pb-[6cqw]' },
      pics.map((src, n) => {
        const b = h('button', { type: 'button', class: 'w-[62cqw] shrink-0 snap-center rounded-[1.5cqw] bg-white p-[2.4cqw] pb-[9cqw] text-left shadow-[0_3cqw_8cqw_-3cqw_rgba(40,20,10,.45)]', 'aria-label': S.photoOf(n + 1, pics.length) },
          h('img', { src, alt: '', loading: 'lazy', class: 'aspect-[4/5] w-full rounded-[0.6cqw] object-cover' }));
        M.set(b, { rotate: TILT[n % TILT.length] });
        b.addEventListener('pointerdown', () => M.animate(b, { scale: 0.97 }));
        ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => M.animate(b, { scale: 1 })));
        b.addEventListener('click', () => openLightbox(n));
        return b;
      }));
    strip.addEventListener('scroll', () => {
      const f = strip.firstElementChild;
      if (f) setDot(Math.round(strip.scrollLeft / (f.offsetWidth + 16)));
    }, { passive: true });

    let box = null;
    let index = 0;
    function showImage() {
      const pic = h('img', { src: pics[index], alt: '', class: 'max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl', draggable: 'false', style: 'touch-action:pan-y' });
      M.set(pic, { opacity: 0, scale: 0.94 });
      M.animate(pic, { opacity: 1, scale: 1 });
      pic.addEventListener('click', (e) => e.stopPropagation());
      // horizontal drag with elastic snap-back; swipe > 60px changes photo (framer drag="x")
      let startX = null, moved = 0;
      pic.addEventListener('pointerdown', (e) => { startX = e.clientX; moved = 0; pic.setPointerCapture(e.pointerId); M.stop(pic); });
      pic.addEventListener('pointermove', (e) => { if (startX === null) return; moved = e.clientX - startX; M.set(pic, { x: moved * 0.5 }); });
      const up = () => {
        if (startX === null) return;
        startX = null;
        M.animate(pic, { x: 0 }, { type: 'spring', stiffness: 500, damping: 40 });
        if (Math.abs(moved) > 60) step(moved < 0 ? 1 : -1);
      };
      pic.addEventListener('pointerup', up);
      pic.addEventListener('pointercancel', up);
      const old = box.querySelector('img');
      old ? old.replaceWith(pic) : box.prepend(pic);
      caption.textContent = `${index + 1} / ${pics.length} · ${S.tapOutside}`;
    }
    const caption = h('p', { class: 'absolute bottom-6 text-sm text-white/70' });
    function step(d) { index = (index + d + pics.length) % pics.length; showImage(); }
    function closeLightbox() {
      if (!box) return;
      const b = box;
      box = null;
      M.animate(b, { opacity: 0 }).then(() => b.remove());
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    }
    function openLightbox(n) {
      index = n;
      box = h('div', { class: 'fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Photo viewer' },
        pics.length > 1 && [-1, 1].map((d) => {
          const nav = h('button', { type: 'button', 'aria-label': d < 0 ? 'Previous photo' : 'Next photo', class: `absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-xl text-white ${d < 0 ? 'left-3' : 'right-3'}` }, d < 0 ? '‹' : '›');
          nav.addEventListener('click', (e) => { e.stopPropagation(); step(d); });
          return nav;
        }),
        caption);
      box.addEventListener('click', closeLightbox);
      M.set(box, { opacity: 0 });
      M.animate(box, { opacity: 1 });
      section.append(box);
      showImage();
      document.addEventListener('keydown', onKey);
    }

    section = h('section', { class: `${UI.section} !px-0` },
      Reveal(Title(S.momentsKicker, S.momentsTitle), { cls: 'px-[12cqw]' }),
      Reveal([strip, h('div', { class: 'flex justify-center gap-[1.5cqw]', 'aria-hidden': 'true' }, dots)], { delay: 0.1 }));
    return section;
  }

  /* ------------------------------------------------------------------ */
  /* RSVP (WhatsApp)                                                     */
  /* ------------------------------------------------------------------ */
  const CHECK = () => h('svg', { viewBox: '0 0 16 16', class: 'size-[1.1em] shrink-0', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' },
    h('path', { d: 'M3 8.5l3.2 3L13 4.5' }));
  function RsvpSection() {
    const st = { coming: 'yes', guests: 2, picked: [], pickError: false, notice: false };
    const fns = D.events.map((e) => e.name);
    const nameInput = h('input', { required: true, placeholder: S.namePlaceholder, class: `${UI.input} mt-2` });
    const noteInput = h('textarea', { rows: '2', placeholder: S.optional, class: `${UI.input} mt-2 resize-none` });
    const label = (t) => h('span', { class: 'inv-label text-[2.5cqw] opacity-70' }, t);
    const form = h('form', { class: `${UI.card} mt-8 space-y-[5cqw] p-[6cqw]` });
    let noticeEl = null;

    function render() {
      const kids = [];
      kids.push(h('div', { class: 'grid grid-cols-2 gap-[2.5cqw]' },
        ['yes', 'no'].map((v) => h('button', {
          type: 'button', 'aria-pressed': String(st.coming === v), class: `${st.coming === v ? UI.chipOn : UI.chip} py-[3cqw] text-[3.6cqw]`,
          onClick: () => { st.coming = v; render(); },
        }, v === 'yes' ? S.accept : S.decline))));
      kids.push(h('label', { class: 'block' }, label(S.yourName), nameInput));
      if (st.coming === 'yes') {
        const counter = h('span', { class: 'inv-serif w-[6cqw] text-center text-[6cqw] tabular-nums' }, String(st.guests));
        kids.push(h('div', { class: 'flex items-center justify-between' },
          label(S.guests),
          h('div', { class: 'flex items-center gap-[3cqw]' },
            h('button', { type: 'button', 'aria-label': 'Fewer guests', class: `${UI.chip} size-[9cqw] text-[5cqw] leading-none`, onClick: () => { st.guests = Math.max(1, st.guests - 1); counter.textContent = st.guests; } }, '−'),
            counter,
            h('button', { type: 'button', 'aria-label': 'More guests', class: `${UI.chip} size-[9cqw] text-[5cqw] leading-none`, onClick: () => { st.guests = Math.min(12, st.guests + 1); counter.textContent = st.guests; } }, '+'))));
        if (fns.length > 1) {
          kids.push(h('div', null,
            label(S.attendingAt),
            h('p', { class: `mt-1 text-[3cqw] ${UI.muted}` }, S.tapToPick),
            h('div', { class: 'mt-2 flex flex-wrap gap-[2cqw]' },
              fns.map((f) => {
                const on = st.picked.includes(f);
                return h('button', {
                  type: 'button', 'aria-pressed': String(on), class: `${on ? UI.chipOn : UI.chip} inline-flex items-center gap-[1.5cqw] px-[3.5cqw] py-[1.8cqw] text-[3.2cqw]`,
                  onClick: () => { st.pickError = false; st.picked = on ? st.picked.filter((x) => x !== f) : [...st.picked, f]; render(); },
                }, on && CHECK(), f);
              })),
            st.pickError && h('p', { role: 'alert', class: 'mt-2 text-[3.2cqw] font-medium text-[#c0392b]' }, S.pickOne)));
        }
      }
      kids.push(h('label', { class: 'block' }, label(S.note), noteInput));
      kids.push(h('button', { type: 'submit', class: `${UI.button} w-full justify-center py-[3.6cqw] text-[3.8cqw]` }, WA(), ' ', S.sendRsvp));
      if (st.notice) {
        if (!noticeEl) {
          noticeEl = h('p', { role: 'status', class: 'rounded-[3cqw] bg-black/5 px-[4cqw] py-[3cqw] text-center text-[3.4cqw] leading-snug' }, S.demoNotice);
          M.set(noticeEl, { opacity: 0, y: 6 });
          M.animate(noticeEl, { opacity: 1, y: 0 });
        }
        kids.push(noticeEl);
      }
      form.replaceChildren(...kids);
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (st.coming === 'yes' && fns.length > 1 && !st.picked.length) { st.pickError = true; render(); return; }
      if (D.rsvp.demo) { st.notice = true; render(); return; }
      const name = nameInput.value;
      const chosen = fns.length === 1 ? fns : fns.filter((f) => st.picked.includes(f));
      const lines = st.coming === 'yes'
        ? S.rsvpYes(LEAD.first, OTHER.first, name, st.guests, chosen.join(', '))
        : S.rsvpNo(LEAD.first, OTHER.first, name);
      if (noteInput.value.trim()) lines.push(S.rsvpNote(noteInput.value.trim()));
      window.open(`https://wa.me/${D.rsvp.phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
    });
    render();

    return h('section', { class: UI.section, id: 'rsvp' },
      Reveal([
        Title(S.rsvpKicker, D.rsvpTitle || S.rsvpTitle),
        h('p', { class: `mt-3 text-center text-[3.6cqw] ${UI.muted}` }, S.replyBy(F.dayMonthYear(D.rsvp.by))),
      ]),
      Reveal(form, { delay: 0.1 }));
  }

  /* ------------------------------------------------------------------ */
  /* Closing + footer                                                    */
  /* ------------------------------------------------------------------ */
  function Closing() {
    const st = (color) => ({ color, textShadow: SHADOW });
    return h('section', { class: 'relative overflow-hidden px-[11cqw] pt-[8cqw] pb-[16cqw] text-center' },
      Reveal([
        h('div', { 'aria-hidden': 'true', class: 'relative mx-auto w-[70cqw] overflow-hidden border border-[#d9b97a]', style: { aspectRatio: '100 / 142', borderRadius: '50% 50% 6px 6px / 30% 30% 6px 6px' } },
          img(`${IMG}/shiv-sky.jpg`),
          h('div', { class: 'absolute', style: { left: '-12%', top: '53.5%', width: '112%', aspectRatio: '1100 / 618' } }, img(`${IMG}/shiv-hand.webp`, { contain: true })),
          h('div', { class: 'absolute top-0', style: { left: '40%', width: '90%', aspectRatio: '788 / 890' } }, img(`${IMG}/shiv-parvati-step.webp`, { contain: true }))),
        Divider('mt-[4cqw]'),
        h('p', { class: 'inv-serif mt-[4cqw] text-[5.2cqw] leading-snug font-semibold italic', style: st(INK) }, D.closing),
        h('p', { class: 'inv-script mt-[3cqw] text-[14cqw] leading-[1.1]', style: st(ACCENT) }, `${LEAD.first} ${D.joiner || '&'} ${OTHER.first}`),
        D.hashtag && h('p', { class: 'inv-label !normal-case mt-[3cqw] text-[4.6cqw] font-bold tracking-[0.06em]', style: st(DEEP) }, D.hashtag),
        !D.noBranding && h('a', { class: 'inv-label mt-[6cqw] inline-block text-[2.4cqw] font-semibold', style: st(SOFT), href: D.brandHref || '/' }, S.craftedBy(D.brandName)),
      ]));
  }

  /* ------------------------------------------------------------------ */
  /* Backdrop, frame, bottom bar (scroll hint + music)                   */
  /* ------------------------------------------------------------------ */
  const Backdrop = () =>
    h('div', { class: 'pointer-events-none absolute inset-0', style: { background: BLUSH } },
      h('div', { class: 'sticky top-0 h-[var(--screen-h,100dvh)] w-full' },
        img(`${IMG}/shiv-sky.jpg`),
        h('div', { class: 'absolute inset-0', style: { background: 'radial-gradient(80% 65% at 50% 45%, rgba(255,252,250,.74), rgba(255,252,250,.36) 85%)' } })));

  function Frame() {
    const mask = 'linear-gradient(to bottom, #000 0%, #000 0%, transparent 4%, transparent 96%, #000 100%, #000 100%), linear-gradient(to right, #000 0%, #000 0%, transparent 2%, transparent 98%, #000 100%, #000 100%)';
    const layer = h('div', { class: 'absolute inset-0', 'aria-hidden': 'true' },
      h('div', { class: 'absolute inset-x-0 bottom-full h-[50vh]', style: { background: PAPER } }),
      h('div', { class: 'absolute inset-0', style: { WebkitMaskImage: mask, maskImage: mask } }, img(`${IMG}/shiv-sky.jpg`)),
      h('div', { class: 'absolute inset-x-0 top-full h-[50vh]', style: { background: PAPER } }));
    M.set(layer, { opacity: 0 });
    const el = h('div', { class: 'pointer-events-none fixed inset-0 z-30 flex justify-center' },
      h('div', { class: '@container relative h-full w-full max-w-[480px] overflow-x-clip' }, layer));
    el.update = (scroller) => {
      const s = (1536 * Math.min(window.innerWidth, 480)) / 864;
      M.set(layer, { opacity: M.transform(scroller.scrollTop, [0.35 * s, 0.75 * s], [0, 1]) });
    };
    return el;
  }

  function ScrollHint(scroller) {
    let ready = false, scrolled = false;
    const chevron = h('svg', { viewBox: '0 0 24 24', class: 'size-[1.2em]', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.4', 'aria-hidden': 'true' }, h('path', { d: 'M6 9l6 6 6-6' }));
    M.animate(chevron, { y: [0, 4, 0] }, { duration: 1.4, repeat: Infinity, ease: 'easeInOut' });
    const base = `${PILL} absolute bottom-[calc(env(safe-area-inset-bottom)+18px)] left-1/2 -translate-x-1/2`;
    const btn = h('button', { type: 'button', class: `${base} pointer-events-none`, 'aria-hidden': 'true', tabindex: '-1' }, S.scrollToSeeMore, chevron);
    M.set(btn, { opacity: 0 });
    btn.addEventListener('click', () => scroller.scrollBy({ top: 0.85 * scroller.clientHeight, behavior: 'smooth' }));
    const sync = () => {
      const u = ready && !scrolled;
      btn.setAttribute('class', `${base} ${u ? '' : 'pointer-events-none'}`);
      btn.setAttribute('aria-hidden', String(!u));
      btn.setAttribute('tabindex', u ? '0' : '-1');
      M.animate(btn, { opacity: u ? 1 : 0 }, { duration: 0.5, delay: u ? 0.4 : 0 });
    };
    const onScroll = () => { if (scroller.scrollTop > 80 && !scrolled) { scrolled = true; scroller.removeEventListener('scroll', onScroll); sync(); } };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    btn.ready = () => { ready = true; sync(); };
    return btn;
  }

  function MusicButton() {
    let audio = null;
    let playing = false;
    const btn = h('button', { class: `pointer-events-auto absolute right-4 bottom-4 grid size-11 place-items-center rounded-full shadow-lg backdrop-blur ${UI.tile}` });
    const draw = () => {
      btn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
      if (playing) {
        const bars = [0, 1, 2, 3].map((i) => {
          const b = h('span', { class: 'w-[3px] rounded-full bg-current' });
          M.animate(b, { height: ['30%', '100%', '45%', '80%', '30%'] }, { duration: 1.1 + 0.15 * i, repeat: Infinity, ease: 'easeInOut' });
          return b;
        });
        btn.replaceChildren(h('span', { class: 'flex h-4 items-end gap-[2px]' }, bars));
      } else {
        btn.replaceChildren(h('svg', { viewBox: '0 0 24 24', class: 'size-4', fill: 'currentColor', 'aria-hidden': 'true' },
          h('path', { d: 'M9 18V6l11-2v12', stroke: 'currentColor', 'stroke-width': '2', fill: 'none' }),
          h('circle', { cx: '6', cy: '18', r: '3' }), h('circle', { cx: '17', cy: '16', r: '3' })));
      }
    };
    const setPlaying = (v) => { if (playing !== v) { playing = v; draw(); } };
    btn.play = () => {
      if (!D.music) return;
      if (!audio) { audio = new Audio(D.music); audio.volume = 0.6; audio.loop = true; }
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    };
    btn.pause = () => { audio && audio.pause(); setPlaying(false); };
    btn.addEventListener('click', () => (playing ? btn.pause() : btn.play()));
    document.addEventListener('visibilitychange', () => document.hidden && btn.pause());
    draw();
    return btn;
  }

  /* ------------------------------------------------------------------ */
  /* text fitting (original "fit" pass over .inv-script)                 */
  /* ------------------------------------------------------------------ */
  function fitText(root) {
    const measure = (el, t) => {
      const s = getComputedStyle(el);
      const c = ctx2d();
      c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      return c.measureText(t).width;
    };
    const avail = (el) => {
      let a = Infinity;
      for (let s = el; s && s !== root.parentElement; s = s.parentElement) {
        if (!s.clientWidth) continue;
        const cs = getComputedStyle(s);
        a = Math.min(a, s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
      }
      return a;
    };
    root.querySelectorAll('.inv-label, .inv-script').forEach((e) => e.toggleAttribute('data-deva', /[ऀ-ॿ]/.test(e.textContent || '')));
    root.querySelectorAll('.inv-script').forEach((a) => {
      if (a.dataset.fitBase === undefined) a.dataset.fitBase = a.style.fontSize;
      a.style.fontSize = a.dataset.fitBase;
      const text = (a.textContent || '').trim();
      if (!text) return;
      const words = getComputedStyle(a).whiteSpace.includes('nowrap') ? [text] : text.split(/\s+/);
      const l = Math.max(...words.map((w) => measure(a, w)));
      const r = avail(a);
      if (l > r && r > 0) a.style.fontSize = `${(parseFloat(getComputedStyle(a).fontSize) * r * 0.96) / l}px`;
    });
  }

  /* ------------------------------------------------------------------ */
  /* page assembly + open flow                                           */
  /* ------------------------------------------------------------------ */
  function mount() {
    const app = document.getElementById('app');
    const root = h('div', {
      lang: 'en',
      style: { '--inv-script': 'var(--font-great-vibes), cursive', '--inv-serif': 'var(--font-cormorant), serif', '--inv-label': 'var(--font-cinzel), serif', background: PAPER, color: INK, '--inv-accent': ACCENT },
      class: ' [&_.opacity-70]:!opacity-95 [&_.opacity-80]:!opacity-100  fixed inset-0 overflow-x-hidden overscroll-y-none overflow-y-hidden',
    });
    document.documentElement.style.backgroundColor = PAPER;
    document.body.style.backgroundColor = PAPER;

    const hero = Hero();
    const blessing = Blessing();
    const main = h('main', { class: '@container relative mx-auto w-full max-w-[480px] overflow-x-clip shadow-[0_0_80px_rgba(0,0,0,.25)]' },
      Backdrop(),
      h('div', { class: 'relative' },
        hero,
        !D.hideFamilies && blessing,
        !D.hideFamilies && Divider(),
        ScratchSection(),
        CountdownSection(),
        EventsSection(),
        GallerySection(),
        RsvpSection(),
        Closing()));
    root.append(main);

    let opened = false;
    let frame = null;
    let music = null;
    let hint = null;
    const open = () => {
      if (opened) return;
      opened = true;
      music.play();
      root.classList.replace('overflow-y-hidden', 'overflow-y-auto');
      overlay.classList.add('pointer-events-none');
      opening.opened();
      tapHint.opened();
      hero.opened();
      frame = Frame();
      hint = ScrollHint(root);
      root.append(frame, h('div', { class: 'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center' },
        h('div', { class: 'relative w-full max-w-[480px]' }, hint, music)));
      update();
      requestAnimationFrame(() => fitText(root));
      setTimeout(() => { overlay.remove(); hint.ready(); }, OPENING_MS);
    };
    music = MusicButton();
    const opening = Opening(open);
    const tapHint = TapHint(open);
    const overlay = h('div', { class: 'fixed inset-0 z-50 flex justify-center' },
      h('div', { class: '@container relative h-full w-full max-w-[480px]' }, opening, tapHint));
    root.append(overlay);
    app.replaceWith(root);

    let ticking = false;
    function update() {
      ticking = false;
      hero.update(root);
      blessing.update(root);
      frame && frame.update(root);
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    const refit = () => fitText(root);
    refit();
    document.fonts && document.fonts.ready.then(refit);
    new ResizeObserver(refit).observe(root);

    // test hook (used by the visual-comparison scripts): open without a click
    window.__openInvite = open;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
