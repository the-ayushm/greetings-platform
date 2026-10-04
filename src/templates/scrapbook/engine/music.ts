/**
 * Audio engine: the customer's uploaded song if there is one, otherwise the original
 * music-box tune synthesised with WebAudio (ported unchanged from the legacy file).
 */

export type Music = {
  play: () => Promise<void> | void;
  pause: () => void;
  pos: () => number;
  dur: () => number;
  seek: (t: number) => void;
  /** Swap the source URL (signed URLs expire); keeps position when possible. */
  setSrc?: (src: string) => void;
  onError?: (fn: () => void) => void;
  destroy: () => void;
  demo: boolean;
};

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

/** iOS mutes WebAudio when the ringer switch is off unless the session is "playback". */
function preferPlaybackSession() {
  try {
    const n = navigator as AudioSessionNavigator;
    if (n.audioSession) n.audioSession.type = "playback";
  } catch {
    /* not supported */
  }
}

export function createFileMusic(src: string): Music {
  const a = new Audio();
  a.preload = "none";
  a.loop = true;
  a.src = src;
  let errorFn: (() => void) | null = null;
  a.addEventListener("error", () => errorFn?.());
  return {
    play: () => {
      preferPlaybackSession();
      return a.play();
    },
    pause: () => a.pause(),
    pos: () => a.currentTime || 0,
    dur: () => (isFinite(a.duration) ? a.duration : 0),
    seek: (t) => {
      try {
        a.currentTime = t;
      } catch {
        /* not seekable yet */
      }
    },
    setSrc(next) {
      const at = a.currentTime || 0;
      const wasPlaying = !a.paused;
      a.src = next;
      if (at) a.addEventListener("loadedmetadata", () => this.seek(at), { once: true });
      if (wasPlaying) void a.play().catch(() => undefined);
    },
    onError(fn) {
      errorFn = fn;
    },
    destroy() {
      a.pause();
      a.removeAttribute("src");
      a.load();
    },
    demo: false,
  };
}

export function createMusicBox(): Music {
  const beat = 0.42,
    seq: [number, number][] = [[76, 1], [79, 1], [84, 2], [83, 1], [79, 1], [81, 2], [77, 1], [81, 1], [79, 2], [76, 1], [74, 1], [72, 2], [74, 1], [76, 1], [77, 2], [76, 1], [72, 1], [74, 2], [71, 1], [74, 1], [72, 4]];
  const starts: number[] = [];
  let tot = 0;
  seq.forEach((n) => {
    starts.push(tot * beat);
    tot += n[1];
  });
  const dur = tot * beat,
    N = seq.length;
  let ac: AudioContext | null = null,
    t0 = 0,
    off = 0,
    k = 0,
    iv = 0,
    on = false;
  const nt = (i: number) => Math.floor(i / N) * dur + starts[i % N]!;
  const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
  function note(t: number, m: number, len: number, vol: number) {
    if (!ac) return;
    const o = ac.createOscillator(),
      o2 = ac.createOscillator(),
      g = ac.createGain();
    o.type = "sine";
    o.frequency.value = hz(m);
    o2.type = "triangle";
    o2.frequency.value = hz(m) * 2;
    const g2 = ac.createGain();
    g2.gain.value = 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + len);
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(ac.destination);
    o.start(t);
    o2.start(t);
    o.stop(t + len + 0.05);
    o2.stop(t + len + 0.05);
  }
  function sched() {
    if (!ac) return;
    const now = ac.currentTime - t0;
    while (nt(k) < now + 0.3) {
      const [m, b] = seq[k % N]!,
        t = Math.max(ac.currentTime, t0 + nt(k));
      note(t, m, b * beat * 1.9, 0.16);
      if (b >= 2) note(t, m - 19, b * beat * 2.2, 0.1);
      k++;
    }
  }
  function start() {
    if (!ac) return;
    t0 = ac.currentTime - off;
    k = 0;
    while (nt(k) < off - 0.01) k++;
    sched();
    iv = window.setInterval(sched, 80);
    on = true;
  }
  return {
    play() {
      preferPlaybackSession();
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ac = ac || new Ctx();
      void ac.resume();
      start();
    },
    pause() {
      if (!on || !ac) return;
      off = (ac.currentTime - t0) % dur;
      clearInterval(iv);
      on = false;
    },
    pos: () => (on && ac ? (ac.currentTime - t0) % dur : off),
    dur: () => dur,
    seek(t) {
      off = Math.max(0, t) % dur;
      if (on) {
        clearInterval(iv);
        start();
      }
    },
    destroy() {
      clearInterval(iv);
      on = false;
      void ac?.close().catch(() => undefined);
      ac = null;
    },
    demo: true,
  };
}
