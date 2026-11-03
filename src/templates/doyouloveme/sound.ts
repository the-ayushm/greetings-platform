/**
 * Tiny synthesised interaction sounds (no audio files): a soft "boop" for each No that sinks a
 * little lower every time, and a bright chime for Yes. Created only from a tap (the visitor
 * turning sound on), so browsers allow it; `destroy()` closes the audio context.
 */

export type Sfx = {
  no: (step: number) => void;
  yes: () => void;
  destroy: () => void;
};

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function createSfx(): Sfx | null {
  const Ctor = typeof window === "undefined" ? undefined : window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  let ac: AudioContext;
  try {
    ac = new Ctor();
  } catch {
    return null;
  }

  function tone(freq: number, at: number, len: number, type: OscillatorType, vol: number) {
    if (ac.state === "closed") return;
    if (ac.state === "suspended") void ac.resume();
    const t = ac.currentTime + at;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + len);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + len + 0.05);
  }

  return {
    no(step) {
      const f = 540 * Math.pow(0.955, Math.min(step, 16));
      tone(f, 0, 0.14, "triangle", 0.07);
      tone(f * 0.78, 0.075, 0.2, "sine", 0.06);
    },
    yes() {
      [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => tone(f, i * 0.085, 0.55, "sine", 0.065));
      tone(1975.5, 0.36, 0.7, "triangle", 0.02);
    },
    destroy() {
      void ac.close().catch(() => undefined);
    },
  };
}
