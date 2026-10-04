/**
 * Decorative effects ported from the legacy renderer without behavioural changes:
 * timers that are cancelled on every scene change, heart/sparkle pops, canvas confetti and
 * rising hearts. Everything they create is engine-owned text (glyphs), never customer content.
 */

export type Timers = { later: (fn: () => void, ms: number) => number; clear: () => void };

export function createTimers(reduced: () => boolean): Timers {
  let ids: number[] = [];
  return {
    later(fn, ms) {
      const t = window.setTimeout(fn, reduced() ? Math.min(ms, 60) : ms);
      ids.push(t);
      return t;
    },
    clear() {
      ids.forEach(clearTimeout);
      ids = [];
    },
  };
}

/** tiny heart/sparkle pop from a point */
export function pop(app: HTMLElement, x: number, y: number, n = 9) {
  const r = app.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "popbit";
    s.setAttribute("aria-hidden", "true");
    s.textContent = i % 3 ? "♥" : "✦";
    s.style.cssText = `left:${x - r.left}px;top:${y - r.top}px;font-size:${12 + Math.random() * 14}px;color:${["var(--red)", "var(--pink)", "#fff", "var(--lav)"][i % 4]}`;
    app.appendChild(s);
    const ang = Math.random() * Math.PI * 2,
      d = 40 + Math.random() * 60;
    s.animate(
      [
        { transform: "translate(-50%,-50%) scale(.4)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * d}px),calc(-50% + ${Math.sin(ang) * d - 30}px)) scale(1.1) rotate(${Math.random() * 80 - 40}deg)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.3,1)" },
    ).onfinish = () => s.remove();
  }
}

export function popAt(app: HTMLElement, el: Element | null, n?: number) {
  if (!el) return;
  const b = el.getBoundingClientRect();
  pop(app, b.left + b.width / 2, b.top + b.height / 2, n);
}

type Part = { x: number; y: number; vx: number; vy: number; s: number; c: string; r: number; vr: number; life: number; h: boolean };

/** light confetti */
export function createConfetti(cv: HTMLCanvasElement, app: HTMLElement) {
  const cx = cv.getContext("2d");
  let parts: Part[] = [];
  let raf = 0;

  function size() {
    if (!cx) return;
    const d = Math.min(devicePixelRatio || 1, 2);
    cv.width = app.clientWidth * d;
    cv.height = app.clientHeight * d;
    cx.setTransform(d, 0, 0, d, 0, 0);
  }

  function tick() {
    if (!cx) return;
    const W = app.clientWidth,
      H = app.clientHeight;
    cx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => p.y < H + 30 && p.life < 260);
    for (const p of parts) {
      p.vy += 0.2;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += Math.min(p.vy, 5);
      p.r += p.vr;
      p.life++;
      cx.save();
      cx.translate(p.x, p.y);
      cx.rotate(p.r);
      cx.globalAlpha = Math.max(0, 1 - (p.life - 170) / 90);
      cx.fillStyle = p.c;
      if (p.h) {
        cx.font = `${p.s * 2.2}px Georgia,serif`;
        cx.fillText("♥", -p.s, p.s);
      } else cx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      cx.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
  }

  function burst(n = 70, ox = 0.5, oy = 0.45) {
    const st = getComputedStyle(app);
    const cols = ["--pink", "--red", "--lav", "--cream", "--blush"].map((v) => st.getPropertyValue(v).trim()).concat("#ffffff");
    const W = app.clientWidth,
      H = app.clientHeight;
    for (let i = 0; i < n; i++)
      parts.push({ x: W * ox, y: H * oy, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 10 - 3, s: 5 + Math.random() * 7, c: cols[i % cols.length]!, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, life: 0, h: Math.random() < 0.35 });
    if (!raf) raf = requestAnimationFrame(tick);
  }

  size();
  addEventListener("resize", size);
  return {
    burst,
    destroy() {
      removeEventListener("resize", size);
      if (raf) cancelAnimationFrame(raf);
      parts = [];
    },
  };
}

/** hearts rising over the final scene */
export function hearts(app: HTMLElement, timers: Timers, n: number) {
  for (let i = 0; i < n; i++)
    timers.later(() => {
      const h = document.createElement("span");
      h.className = "rise";
      h.setAttribute("aria-hidden", "true");
      h.textContent = i % 4 ? "♥" : "✦";
      h.style.cssText = `left:${4 + Math.random() * 90}%;font-size:${16 + Math.random() * 22}px;animation-duration:${5 + Math.random() * 4}s;opacity:.9;color:${i % 3 ? "#fff" : "var(--blush)"}`;
      app.appendChild(h);
      h.addEventListener("animationend", () => h.remove());
    }, i * 260);
}
