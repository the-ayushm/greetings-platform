"use client";

import { useEffect, useState } from "react";
import { useExperience } from "../context";
import type { Music } from "../engine/music";
import { BackButton, Bow, Deco, Photo, pad } from "../parts";

export type SongControls = {
  playing: boolean;
  error: boolean;
  isMusicBox: boolean;
  music: () => Music;
  toggle: (btn: HTMLElement) => Promise<void>;
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;

export function Song({ controls, active }: { controls: SongControls; active: boolean }) {
  const { c, fill } = useExperience();
  const [t, setT] = useState({ p: 0, d: 0, entered: false });

  // songUI(): refresh on entry, then every 200 ms while playing.
  useEffect(() => {
    if (!active) return;
    const ui = () => {
      const m = controls.music();
      setT({ p: m.pos(), d: m.dur(), entered: true });
    };
    ui();
    if (!controls.playing) return;
    const iv = window.setInterval(ui, 200);
    return () => clearInterval(iv);
  }, [active, controls]);

  const refresh = () => {
    const m = controls.music();
    setT({ p: m.pos(), d: m.dur(), entered: true });
  };

  const hint = controls.error
    ? fill(c.copy.audioError)
    : controls.playing
      ? fill(controls.isMusicBox ? c.copy.playingMusicBox : c.copy.playingSong)
      : fill(c.copy.pressPlay);

  return (
    <div className="page">
      <BackButton />
      <div className="song-wrap">
        <div>
          <div className={`player${controls.playing ? " playing" : ""}`} id="player">
            <Deco style={{ right: -10, top: -20, width: 56, transform: "rotate(18deg)" }}>
              <Bow />
            </Deco>
            <div className="lcd">
              <div className="lcd-top">
                <span>{fill(c.copy.nowPlaying)}</span>
                <span className="eq" aria-hidden="true">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </div>
              <p className="lcd-title" dir="auto">{fill(c.song.title)}</p>
              <span className="lcd-artist" dir="auto">{fill(c.song.artist)}</span>
              <button
                className="bar"
                id="bar"
                aria-label="Seek"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect(),
                    m = controls.music(),
                    d = m.dur();
                  if (d) {
                    m.seek(((e.clientX - r.left) / r.width) * d);
                    refresh();
                  }
                }}
              >
                <i id="barFill" style={{ width: t.d ? (t.p / t.d) * 100 + "%" : "0" }}></i>
              </button>
              <div className="lcd-time">
                <span id="tNow">{t.entered ? fmt(t.p) : "0:00"}</span>
                <span id="tAll">{t.entered ? (t.d ? fmt(t.d) : "-:--") : "0:00"}</span>
              </div>
            </div>
            <div className="deck">
              <div className="cd">
                <Photo media={c.song.cover} i={4} alt="album cover" sizes="160px" />
              </div>
              <div className="ctrls">
                <button className="rb play" id="playBtn" aria-label={controls.playing ? "Pause" : "Play"} onClick={(e) => void controls.toggle(e.currentTarget)}>
                  {controls.playing ? "❚❚" : "▶"}
                </button>
                <button
                  className="rb"
                  id="rwBtn"
                  aria-label="Back to start"
                  onClick={() => {
                    controls.music().seek(0);
                    refresh();
                  }}
                >
                  |◂
                </button>
                <button
                  className="rb"
                  id="ffBtn"
                  aria-label="Skip ahead 10 seconds"
                  onClick={() => {
                    const m = controls.music();
                    m.seek(m.pos() + 10);
                    refresh();
                  }}
                >
                  ▸▸
                </button>
              </div>
            </div>
          </div>
          <p className="song-hint" id="songHint" aria-live="polite">
            {hint}
          </p>
        </div>
        <div className="tracklist">
          <span className="tape" style={{ left: 18, top: -2, transform: "rotate(-8deg)" }}></span>
          <h3>{fill(c.reasonsTitle)}</h3>
          <ol>
            {c.reasons.map((r, i) => (
              <li key={i} dir="auto">
                <span aria-hidden="true">{pad(i + 1)}</span>
                {fill(r)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
