/*!
 * motion.js — a tiny re-implementation of the subset of framer-motion behaviour
 * that the original invitation used (keyframes, per-property transitions,
 * cubic-bezier / named easings, springs, infinite repeats, scroll-linked values
 * and "while in view" reveals). No dependencies.
 *
 * API (global `Motion`):
 *   Motion.set(el, values)                 – set values immediately
 *   Motion.animate(el, target, transition) – animate to target (scalar or keyframe array)
 *   Motion.stop(el)                        – stop every running track on el
 *   Motion.inView(el, cb, {amount, once})  – IntersectionObserver helper
 *   Motion.transform(v, inRange, outRange) – clamped range mapping (numbers or unit strings)
 *   Motion.scrollProgress(scroller, target, offset) – framer useScroll() progress
 */
(function () {
  'use strict';

  /* ---------- easing ---------- */
  function cubicBezier(x1, y1, x2, y2) {
    if (x1 === y1 && x2 === y2) return (t) => t;
    const calc = (t, a1, a2) => (((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t + 3 * a1) * t;
    const solve = (x) => {
      // binary subdivision (same approach framer-motion uses)
      let lo = 0, hi = 1, t = 0.5, cur;
      for (let i = 0; i < 14; i++) {
        t = lo + (hi - lo) / 2;
        cur = calc(t, x1, x2) - x;
        if (Math.abs(cur) < 1e-7) break;
        if (cur > 0) hi = t; else lo = t;
      }
      return t;
    };
    return (t) => (t === 0 || t === 1 ? t : calc(solve(t), y1, y2));
  }
  const NAMED = {
    linear: (t) => t,
    easeIn: cubicBezier(0.42, 0, 1, 1),
    easeOut: cubicBezier(0, 0, 0.58, 1),
    easeInOut: cubicBezier(0.42, 0, 0.58, 1),
  };
  const toEase = (e) => (typeof e === 'function' ? e : Array.isArray(e) ? cubicBezier(e[0], e[1], e[2], e[3]) : NAMED[e] || NAMED.easeInOut);

  /* ---------- values ---------- */
  const TRANSFORM = ['x', 'y', 'scale', 'rotate', 'rotateX'];
  const DEFAULTS = { x: 0, y: 0, scale: 1, rotate: 0, rotateX: 0, opacity: 1 };
  const UNIT = { x: 'px', y: 'px', rotate: 'deg', rotateX: 'deg' };
  const NUM_RE = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

  function unitOf(v) {
    if (typeof v !== 'string') return null;
    const m = v.trim().match(/^-?[\d.]+([a-z%]+)$/i);
    return m ? m[1] : null;
  }
  // normalise one keyframe list so every entry is interpolatable
  function normalise(prop, kfs) {
    let unit = null;
    for (const k of kfs) { const u = unitOf(k); if (u) { unit = u; break; } }
    return kfs.map((k) => {
      if (typeof k === 'number') return unit ? k + unit : (UNIT[prop] && prop !== 'scale' ? k + UNIT[prop] : k);
      return k;
    });
  }
  function mix(a, b, p) {
    if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * p;
    const sa = String(a), sb = String(b);
    const na = sa.match(NUM_RE) || [], nb = sb.match(NUM_RE) || [];
    if (na.length !== nb.length) return p < 0.5 ? a : b;
    let i = 0;
    return sb.replace(NUM_RE, () => {
      const v = +na[i] + (+nb[i] - +na[i]) * p;
      i++;
      return String(Math.round(v * 1e5) / 1e5);
    });
  }
  function fmt(prop, v) {
    if (typeof v === 'number' && UNIT[prop]) return v + UNIT[prop];
    return v;
  }

  /* ---------- per element state ---------- */
  const active = new Set();
  function state(el) {
    if (!el.__m) el.__m = { v: {}, tracks: {} };
    return el.__m;
  }
  function render(el) {
    const v = state(el).v;
    let t = '';
    if (v.x !== undefined && !isZero(v.x)) t += `translateX(${fmt('x', v.x)}) `;
    if (v.y !== undefined && !isZero(v.y)) t += `translateY(${fmt('y', v.y)}) `;
    if (v.scale !== undefined && +v.scale !== 1) t += `scale(${v.scale}) `;
    if (v.rotate !== undefined && !isZero(v.rotate)) t += `rotate(${fmt('rotate', v.rotate)}) `;
    if (v.rotateX !== undefined && !isZero(v.rotateX)) t += `rotateX(${fmt('rotateX', v.rotateX)}) `;
    if (TRANSFORM.some((k) => v[k] !== undefined)) el.style.transform = t.trim() || 'none';
    for (const k in v) {
      if (TRANSFORM.includes(k)) continue;
      el.style[k] = typeof v[k] === 'number' && k !== 'opacity' && k !== 'zIndex' ? v[k] + 'px' : v[k];
    }
  }
  const isZero = (x) => parseFloat(x) === 0;

  function set(el, values) {
    if (!el) return;
    const s = state(el);
    for (const k in values) {
      const val = Array.isArray(values[k]) ? values[k][0] : values[k];
      s.v[k] = val;
      delete s.tracks[k];
    }
    render(el);
  }
  function current(el, prop) {
    const v = state(el).v[prop];
    if (v !== undefined) return v;
    if (prop in DEFAULTS) return DEFAULTS[prop];
    return getComputedStyle(el)[prop];
  }

  /* ---------- tracks ---------- */
  function defaultTransition(prop, kfs) {
    if (kfs.length > 2) return { duration: 0.8, ease: 'easeInOut' };
    if (['x', 'y', 'rotate', 'rotateX'].includes(prop)) return { type: 'spring', stiffness: 500, damping: 25 };
    if (prop === 'scale') return { type: 'spring', stiffness: 550, damping: 30 };
    return { duration: 0.3, ease: [0.25, 0.1, 0.35, 1] };
  }
  const OWN = ['duration', 'delay', 'ease', 'times', 'repeat', 'type', 'stiffness', 'damping'];
  function resolve(transition, prop, kfs) {
    const base = {};
    let defined = false;
    for (const k of OWN) if (transition && transition[k] !== undefined) { base[k] = transition[k]; if (k !== 'delay' && k !== 'repeat') defined = true; }
    const own = transition && transition[prop] && typeof transition[prop] === 'object' && !Array.isArray(transition[prop]) ? transition[prop] : null;
    if (own) { Object.assign(base, own); defined = true; }
    return defined ? base : Object.assign(defaultTransition(prop, kfs), base);
  }

  function animate(el, target, transition) {
    if (!el) return Promise.resolve();
    const s = state(el);
    const now = performance.now();
    const promises = [];
    for (const prop in target) {
      const raw = target[prop];
      let kfs = Array.isArray(raw) ? raw.slice() : [current(el, prop), raw];
      const tr = resolve(transition || {}, prop, kfs);
      kfs = normalise(prop, kfs);
      const track = { prop, start: now, delay: (tr.delay || 0) * 1000, repeat: tr.repeat || 0 };
      if (tr.type === 'spring' && kfs.length === 2) {
        track.spring = { k: tr.stiffness || 100, c: tr.damping || 10, from: parseFloat(kfs[0]) || 0, to: parseFloat(kfs[1]), unit: unitOf(String(kfs[1])) || '', x: parseFloat(kfs[0]) || 0, vel: 0, last: null };
      } else {
        track.kfs = kfs;
        track.duration = Math.max(1, (tr.duration ?? 0.3) * 1000);
        const n = kfs.length - 1;
        track.times = tr.times || kfs.map((_, i) => (n ? i / n : 1));
        const e = tr.ease;
        track.eases = Array.from({ length: Math.max(n, 1) }, (_, i) => toEase(Array.isArray(e) && (typeof e[0] !== 'number') ? e[i % e.length] : e));
      }
      track.done = new Promise((r) => (track.resolve = r));
      if (s.tracks[prop]) s.tracks[prop].resolve();
      s.tracks[prop] = track;
      if (track.repeat !== Infinity) promises.push(track.done);
      // value during the delay phase is the first keyframe
      s.v[prop] = track.spring ? (track.spring.unit ? track.spring.from + track.spring.unit : track.spring.from) : kfs[0];
    }
    render(el);
    active.add(el);
    schedule();
    return Promise.all(promises);
  }

  function sample(track, elapsed) {
    const p0 = elapsed / track.duration;
    let p;
    if (track.repeat === Infinity) p = p0 - Math.floor(p0);
    else if (track.repeat > 0) p = p0 >= track.repeat + 1 ? 1 : p0 - Math.floor(p0);
    else p = Math.min(1, p0);
    const { times, kfs, eases } = track;
    if (kfs.length === 1) return kfs[0];
    let i = 0;
    while (i < times.length - 2 && p > times[i + 1]) i++;
    const span = times[i + 1] - times[i] || 1;
    const local = Math.max(0, Math.min(1, (p - times[i]) / span));
    return mix(kfs[i], kfs[i + 1], eases[i](local));
  }

  let raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    for (const el of active) {
      const s = state(el);
      let any = false;
      for (const prop in s.tracks) {
        const tr = s.tracks[prop];
        const elapsed = now - tr.start - tr.delay;
        if (elapsed < 0) { any = true; continue; }
        if (tr.spring) {
          const sp = tr.spring;
          const dt = Math.min(0.064, sp.last === null ? 0.016 : (now - sp.last) / 1000);
          sp.last = now;
          // semi-implicit euler in small steps
          const steps = Math.ceil(dt / 0.004);
          for (let k = 0; k < steps; k++) {
            const a = -sp.k * (sp.x - sp.to) - sp.c * sp.vel;
            sp.vel += a * (dt / steps);
            sp.x += sp.vel * (dt / steps);
          }
          const doneSpring = Math.abs(sp.vel) < 0.05 && Math.abs(sp.x - sp.to) < 0.001;
          if (doneSpring) sp.x = sp.to;
          s.v[prop] = sp.unit ? sp.x + sp.unit : sp.x;
          if (doneSpring) { delete s.tracks[prop]; tr.resolve(); } else any = true;
          continue;
        }
        s.v[prop] = sample(tr, elapsed);
        const finished = tr.repeat !== Infinity && elapsed >= tr.duration * ((tr.repeat || 0) + 1);
        if (finished) { s.v[prop] = tr.kfs[tr.kfs.length - 1]; delete s.tracks[prop]; tr.resolve(); } else any = true;
      }
      render(el);
      if (!any) active.delete(el);
    }
    if (active.size) schedule();
  }

  function stop(el) {
    if (!el || !el.__m) return;
    for (const k in el.__m.tracks) el.__m.tracks[k].resolve();
    el.__m.tracks = {};
    active.delete(el);
  }

  /* ---------- helpers ---------- */
  function transformRange(v, inR, outR) {
    if (v <= inR[0]) return outR[0];
    if (v >= inR[inR.length - 1]) return outR[outR.length - 1];
    let i = 0;
    while (i < inR.length - 2 && v > inR[i + 1]) i++;
    const p = (v - inR[i]) / (inR[i + 1] - inR[i]);
    return mix(outR[i], outR[i + 1], p);
  }

  // offsets like ["start end", "start 15%"] -> scroll progress 0..1 (framer useScroll semantics)
  const EDGE = { start: 0, center: 0.5, end: 1 };
  const edge = (s) => (s in EDGE ? EDGE[s] : s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s));
  function scrollProgress(scroller, target, offset) {
    const st = scroller.scrollTop;
    const ch = scroller.clientHeight;
    const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + st;
    const h = target.offsetHeight;
    const pos = offset.map((o) => {
      const [t, c] = o.split(' ');
      return top + edge(t) * h - edge(c) * ch;
    });
    if (pos[1] === pos[0]) return st >= pos[1] ? 1 : 0;
    return Math.max(0, Math.min(1, (st - pos[0]) / (pos[1] - pos[0])));
  }

  function inView(el, cb, opts) {
    const amount = (opts && opts.amount) ?? 0;
    const once = !opts || opts.once !== false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { cb(); if (once) io.disconnect(); }
      }
    }, { threshold: amount });
    io.observe(el);
    return io;
  }

  // seeded PRNG used by the original (Park–Miller)
  function prng(seed) {
    let t = seed % 0x7fffffff;
    if (t <= 0) t += 0x7ffffffe;
    return () => ((t = (16807 * t) % 0x7fffffff) - 1) / 0x7ffffffe;
  }

  /** Forgets animations of elements that left the page (an invitation was destroyed). */
  function prune() {
    for (const el of active) {
      if (el.isConnected) continue;
      for (const k in el.__m.tracks) el.__m.tracks[k].resolve();
      el.__m.tracks = {};
      active.delete(el);
    }
  }
  window.Motion = { set, animate, stop, inView, transform: transformRange, scrollProgress, prng, cubicBezier, prune };
})();
