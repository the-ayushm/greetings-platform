"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { ChibiCouple, Heart } from "../art";
import { useLove, type RespondResult } from "../context";
import { Btn, NavRow, Paper, Photo, Polaroid, QuestionProgress, StepTitle } from "../parts";
import type { Question } from "../schema";
import { Lines } from "../text";

export function QuestionStep({ index }: { index: number }) {
  const { c } = useLove();
  const q = c.quiz.questions[index];
  const [wrong, setWrong] = useState(false);
  if (!q) return null;
  if (wrong) return <WrongAnswer q={q} onRetry={() => setWrong(false)} />;
  return (
    <div className="lu-scene lu-paper-scene">
      <Paper className="lu-quiz">
        <QuestionProgress index={index} total={c.quiz.questions.length} />
        {q.type === "choice" && <Choice q={q} onWrong={() => setWrong(true)} />}
        {q.type === "image" && <ImageChoice q={q} onWrong={() => setWrong(true)} />}
        {q.type === "slider" && <Slider q={q} />}
        {q.type === "text" && <TextAnswer q={q} />}
        <ChibiCouple className="lu-chibi lu-chibi-quiz" />
      </Paper>
    </div>
  );
}

type Opts<T extends Question["type"]> = { q: Extract<Question, { type: T }>; onWrong: () => void };

function useAnswer(q: Extract<Question, { type: "choice" | "image" }>, onWrong: () => void) {
  const { burst } = useLove();
  const [picked, setPicked] = useState<number | null>(null);
  const correct = q.correct !== null && q.correct < q.options.length ? q.correct : null;
  const pick = (i: number, el: Element | null) => {
    if (correct !== null && i !== correct) {
      onWrong();
      return;
    }
    setPicked(i);
    burst(el, 10);
  };
  return { picked, pick, hasCorrect: correct !== null };
}

function Choice({ q, onWrong }: Opts<"choice">) {
  const { fill, c } = useLove();
  const { picked, pick, hasCorrect } = useAnswer(q, onWrong);
  return (
    <>
      <div className="lu-quiz-head">
        {q.photo && <Polaroid media={q.photo} seed={3} tilt={-5} className="lu-quiz-photo" sizes="180px" />}
        <StepTitle>{fill(q.prompt)}</StepTitle>
      </div>
      <div className="lu-options" role="group" aria-label="Answers">
        {q.options.map((o, i) => (
          <button key={i} type="button" className={`lu-option ${picked === i ? "on" : ""}`} aria-pressed={picked === i} onClick={(e) => pick(i, e.currentTarget)}>
            {fill(o.label)}
          </button>
        ))}
      </div>
      <p className="lu-quiz-note" role="status" aria-live="polite">
        {picked !== null ? fill(hasCorrect && c.quiz.correctReply ? c.quiz.correctReply : q.note) : ""}
      </p>
      {picked === null && q.note && !hasCorrect && <p className="lu-quiz-hint lu-hand">{fill(q.note)}</p>}
      <NavRow canNext={picked !== null} />
    </>
  );
}

function ImageChoice({ q, onWrong }: Opts<"image">) {
  const { fill, c } = useLove();
  const { picked, pick, hasCorrect } = useAnswer(q, onWrong);
  return (
    <>
      <StepTitle>{fill(q.prompt)}</StepTitle>
      <div className={`lu-image-options n${q.options.length}`} role="group" aria-label="Answers">
        {q.options.map((o, i) => (
          <button key={i} type="button" className={`lu-image-option ${picked === i ? "on" : ""}`} aria-pressed={picked === i} onClick={(e) => pick(i, e.currentTarget)} style={{ "--tilt": `${(i % 2 ? 1.5 : -1.5) * (i % 3 ? 1 : 0.6)}deg` } as CSSProperties}>
            <span className="lu-image-option-img">
              <Photo media={o.image} alt="" seed={i + 2} sizes="(max-width: 640px) 45vw, 260px" />
            </span>
            <span className="lu-image-option-label">{fill(o.label)}</span>
            {picked === i && <Heart className="lu-picked-heart" />}
          </button>
        ))}
      </div>
      <p className="lu-quiz-note" role="status" aria-live="polite">
        {picked !== null ? fill(hasCorrect && c.quiz.correctReply ? c.quiz.correctReply : q.note) : ""}
      </p>
      <NavRow canNext={picked !== null} />
    </>
  );
}

function Slider({ q }: { q: Extract<Question, { type: "slider" }> }) {
  const { fill, burst, respond, next } = useLove();
  const [v, setV] = useState(75);
  const [moved, setMoved] = useState(false);
  const thumb = useRef<HTMLSpanElement>(null);
  const id = useId();
  const third = v < 34 ? 0 : v < 67 ? 1 : 2;
  const reply = q.replies[third];
  return (
    <>
      <StepTitle>{fill(q.prompt)}</StepTitle>
      <div className="lu-slider-art" aria-hidden="true">
        <ChibiCouple className="lu-chibi lu-chibi-slider" />
        <span className="lu-slider-hearts" style={{ "--n": v / 100 } as CSSProperties}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Heart key={i} filled={i % 2 === 0} />
          ))}
        </span>
      </div>
      <div className="lu-slider">
        <label htmlFor={id} className="lu-sr">
          {fill(q.prompt)}
        </label>
        <div className="lu-slider-track" style={{ "--v": `${v}%`, "--p": v / 100 } as CSSProperties}>
          <input
            id={id}
            type="range"
            min={0}
            max={100}
            step={1}
            value={v}
            aria-valuetext={`${v} out of 100 — ${fill(q.labels[third])}`}
            onChange={(e) => {
              setV(Number(e.target.value));
              setMoved(true);
            }}
            onPointerUp={() => burst(thumb.current, 6)}
            onKeyUp={(e) => (e.key === "Enter" || e.key === " ") && burst(thumb.current, 6)}
          />
          <span ref={thumb} className="lu-slider-thumb" aria-hidden="true">
            <Heart />
          </span>
        </div>
        <div className="lu-slider-labels" aria-hidden="true">
          {q.labels.map((l, i) => (
            <span key={i} className={i === third ? "on" : ""}>
              {fill(l)}
            </span>
          ))}
        </div>
      </div>
      <p className="lu-quiz-note" role="status" aria-live="polite">
        {moved && reply ? fill(reply) : fill(q.note)}
      </p>
      <NavRow
        onNext={() => {
          if (moved) void respond("slider", q.id, String(v));
          next();
        }}
      />
    </>
  );
}


function TextAnswer({ q }: { q: Extract<Question, { type: "text" }> }) {
  const { fill, respond, next, c, mode } = useLove();
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "sending" | RespondResult>("idle");
  const id = useId();
  const collect = c.responses.collect;

  async function submit() {
    const v = value.trim();
    if (!v || !collect || mode !== "live") {
      next();
      return;
    }
    setState("sending");
    const r = await respond("text", q.id, v);
    setState(r);
    if (r === "stored" || r === "off") setTimeout(next, 900);
  }

  const status: Record<string, string> = {
    sending: "Sending…",
    stored: `Sent to ${fill("{me}")} ♡`,
    off: "Saved only on this screen ♡",
    failed: "Couldn't send it right now — your words stay here on this screen.",
    preview: "Preview: answers aren't sent.",
  };

  return (
    <form
      className="lu-text-q"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <StepTitle>
        <Lines text={fill(q.prompt)} />
      </StepTitle>
      <label htmlFor={id} className="lu-sr">
        Your answer
      </label>
      <textarea id={id} className="lu-textarea" value={value} maxLength={500} rows={3} placeholder={fill(q.placeholder)} onChange={(e) => setValue(e.target.value)} dir="auto" />
      <p className="lu-privacy">
        {collect
          ? mode === "live"
            ? `Your answer will be sent privately to ${fill("{me}")}.`
            : `In the real page, the answer is sent privately to ${fill("{me}")}.`
          : "Your answer stays on this screen — it isn't saved or sent anywhere."}
      </p>
      {q.note && <p className="lu-quiz-hint lu-hand">{fill(q.note)}</p>}
      <p className="lu-quiz-note" role="status" aria-live="polite">
        {state !== "idle" ? status[state] : ""}
      </p>
      {state === "failed" ? (
        <div className="lu-nav">
          <Btn variant="ghost" onClick={() => void submit()}>
            Try again
          </Btn>
          <Btn onClick={next}>
            {fill(c.copy.next)} <span aria-hidden="true">→</span>
          </Btn>
        </div>
      ) : (
        <NavRow onNext={() => void submit()} canNext={state !== "sending"} />
      )}
    </form>
  );
}

function WrongAnswer({ q, onRetry }: { q: Question; onRetry: () => void }) {
  const { c, fill } = useLove();
  const w = c.quiz.wrong;
  const custom = (q.type === "choice" || q.type === "image") && q.wrongMessage ? q.wrongMessage : "";
  return (
    <div className="lu-scene lu-paper-scene">
      <Paper className="lu-wrong">
        <StepTitle>{fill(w.title)}</StepTitle>
        <p className="lu-wrong-msg">
          <Lines text={fill(custom || w.message)} />
        </p>
        <div className="lu-wrong-body">
          <ChibiCouple className="lu-chibi lu-chibi-wrong" />
          {w.bubble && (
            <p className="lu-bubble">
              <Lines text={fill(w.bubble)} />
            </p>
          )}
        </div>
        <Btn onClick={onRetry} className="lu-retry">
          {fill(w.button)} <span aria-hidden="true">→</span>
        </Btn>
      </Paper>
    </div>
  );
}
