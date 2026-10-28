"use client";

import { Heart } from "../art";
import { useLove } from "../context";
import { Btn, Polaroid } from "../parts";
import { Lines } from "../text";
import { NightScene } from "./Night";
import type { MusicApi } from "../Experience";

export function Welcome({ music }: { music: MusicApi }) {
  const { c, fill, next, startMusic } = useLove();
  const w = c.welcome;
  return (
    <NightScene>
      {w.photo && (
        <div className="lu-welcome-photo">
          <Polaroid media={w.photo} caption="" seed={1} tilt={-6} eager sizes="200px" />
        </div>
      )}
      {w.note && (
        <div className="lu-pinned-note" aria-hidden={false}>
          <span className="lu-pin" aria-hidden="true" />
          <p className="lu-hand">
            <Lines text={fill(w.note)} />
          </p>
        </div>
      )}
      <div className="lu-welcome">
        <h1 className="lu-hero lu-glow-text" tabIndex={-1}>
          {fill(w.greeting)} <Heart className="lu-inline-heart" filled={false} />
        </h1>
        {w.intro && (
          <p className="lu-hero-sub">
            <Lines text={fill(w.intro)} />
          </p>
        )}
        <Btn
          variant="glow"
          className="lu-begin"
          onClick={() => {
            startMusic();
            next();
          }}
        >
          {fill(w.button)} <span aria-hidden="true">→</span>
        </Btn>
      </div>
      {c.music.mode !== "none" && <Player music={music} />}
    </NightScene>
  );
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Big player card on the welcome page. Nothing plays until the visitor taps. */
export function Player({ music }: { music: MusicApi }) {
  const { c, fill } = useLove();
  return (
    <div className="lu-player" role="group" aria-label="Music player">
      <button type="button" className="lu-play" onClick={music.toggle} aria-label={music.playing ? "Pause music" : "Play music"} aria-pressed={music.playing}>
        {music.playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div className="lu-player-meta">
        <p className="lu-player-title">{fill(c.music.title) || "Our song"}</p>
        {c.music.artist && <p className="lu-player-artist">{fill(c.music.artist)}</p>}
      </div>
      <div className="lu-player-bar" aria-hidden="true">
        <span className={`lu-wave ${music.playing ? "on" : ""}`}>
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i * 0.13) % 1}s` }} />
          ))}
        </span>
        <span className="lu-player-time">
          {fmt(music.pos)}
          {music.dur ? ` / ${fmt(music.dur)}` : ""}
        </span>
      </div>
      {music.error && (
        <p className="lu-player-error" role="status">
          The song couldn&apos;t load right now ♡
        </p>
      )}
    </div>
  );
}
