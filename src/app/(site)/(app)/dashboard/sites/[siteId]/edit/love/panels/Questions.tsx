"use client";

import { newItemId, type LoveContent, type Question } from "@/templates/lovestory/schema";
import { PhotoPicker, Text } from "../../fields";
import { AddButton, Item, move, Panel } from "../controls";
import type { PanelProps } from "../types";
import { Tokens } from "./Details";

const TYPE_LABEL: Record<Question["type"], string> = { choice: "Multiple choice", image: "Picture choice", slider: "Love slider", text: "Their own words" };
const MAX_Q = 10;

function blank(type: Question["type"]): Question {
  const id = newItemId();
  if (type === "choice") return { id, type, prompt: "", options: [{ label: "" }, { label: "" }], correct: null, note: "", photo: null, wrongMessage: "" };
  if (type === "image") return { id, type, prompt: "", options: [{ label: "", image: null }, { label: "", image: null }], correct: null, note: "", wrongMessage: "" };
  if (type === "slider") return { id, type, prompt: "How much do you love me?", labels: ["A little", "A lot", "A whole universe ♡"], replies: ["", "", ""], note: "" };
  return { id, type, prompt: "", placeholder: "Type something...", note: "" };
}

type QEdit = (fn: (q: Question) => void) => void;

export function QuestionsPanel({ c, edit, lib }: PanelProps) {
  const qs = c.quiz.questions;
  const w = c.quiz.wrong;
  return (
    <div className="space-y-5">
      <Panel title="2–7 · Questions" hint="One question per page. Set a right answer to show the cute “Are you sure?” page on a wrong guess — or leave every answer right.">
        {qs.map((q, i) => {
          const qe: QEdit = (fn) => edit((d) => fn(d.quiz.questions[i]!));
          return (
            <Item
              key={q.id}
              label={`Question ${i + 1}`}
              badge={<span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink-soft">{TYPE_LABEL[q.type]}</span>}
              index={i}
              count={qs.length}
              min={1}
              onMove={(to) => edit((d) => void (d.quiz.questions = move(d.quiz.questions, i, to)))}
              onRemove={() => edit((d) => void d.quiz.questions.splice(i, 1))}
            >
              <Text label="Question" required max={140} value={q.prompt} onChange={(v) => qe((x) => void (x.prompt = v))} />
              {q.type === "choice" && <ChoiceFields q={q} qe={qe} lib={lib} />}
              {q.type === "image" && <ImageFields q={q} qe={qe} lib={lib} />}
              {q.type === "slider" && <SliderFields q={q} qe={qe} />}
              {q.type === "text" && <TextFields q={q} qe={qe} c={c} />}
            </Item>
          );
        })}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABEL) as Question["type"][]).map((t) => (
            <AddButton key={t} disabled={qs.length >= MAX_Q} onClick={() => edit((d) => void d.quiz.questions.push(blank(t)))}>
              + {TYPE_LABEL[t]}
            </AddButton>
          ))}
        </div>
        {qs.length >= MAX_Q && <p className="text-xs text-ink-soft">Up to {MAX_Q} questions.</p>}
        <Tokens />
      </Panel>
      <Panel title="Right & wrong answers" hint="Shown when a question has a right answer.">
        <Text label="When they pick the right answer" max={80} value={c.quiz.correctReply} onChange={(v) => edit((d) => void (d.quiz.correctReply = v))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Wrong-answer title" required max={40} value={w.title} onChange={(v) => edit((d) => void (d.quiz.wrong.title = v))} />
          <Text label="Try-again button" required max={24} value={w.button} onChange={(v) => edit((d) => void (d.quiz.wrong.button = v))} />
        </div>
        <Text label="Wrong-answer message" multiline max={200} value={w.message} onChange={(v) => edit((d) => void (d.quiz.wrong.message = v))} />
        <Text label="Speech bubble" multiline max={240} value={w.bubble} onChange={(v) => edit((d) => void (d.quiz.wrong.bubble = v))} />
      </Panel>
    </div>
  );
}

function RightAnswer({ q, qe }: { q: Extract<Question, { type: "choice" | "image" }>; qe: QEdit }) {
  return (
    <fieldset className="rounded-lg bg-white/70 p-3">
      <legend className="px-1 text-sm font-bold">Right answer</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" className="size-4 accent-rose" checked={q.correct === null} onChange={() => qe((x) => void ((x as typeof q).correct = null))} /> Every answer is right ♡
        </label>
        {q.options.map((o, k) => (
          <label key={k} className="flex items-center gap-2">
            <input type="radio" className="size-4 accent-rose" checked={q.correct === k} onChange={() => qe((x) => void ((x as typeof q).correct = k))} /> {o.label || `Answer ${k + 1}`}
          </label>
        ))}
      </div>
      {q.correct !== null && <Text label="Custom wrong-answer message (optional)" multiline max={200} value={q.wrongMessage} onChange={(v) => qe((x) => void ((x as typeof q).wrongMessage = v))} placeholder="leave empty to use the general one" />}
    </fieldset>
  );
}

/** Removing an option keeps the right-answer index pointing at the same option. */
function removeOption(x: Extract<Question, { type: "choice" | "image" }>, k: number) {
  x.options.splice(k, 1);
  if (x.correct === k) x.correct = null;
  else if (x.correct !== null && x.correct > k) x.correct--;
}

function ChoiceFields({ q, qe, lib }: { q: Extract<Question, { type: "choice" }>; qe: QEdit; lib: PanelProps["lib"] }) {
  const cq = (fn: (x: typeof q) => void) => qe((x) => fn(x as typeof q));
  return (
    <>
      {q.options.map((o, k) => (
        <div key={k} className="flex items-end gap-2">
          <div className="flex-1">
            <Text label={`Answer ${k + 1}`} required max={60} value={o.label} onChange={(v) => cq((x) => void (x.options[k]!.label = v))} />
          </div>
          <button type="button" className="mb-1 rounded px-2 py-2 text-xs font-bold text-rose disabled:opacity-30" disabled={q.options.length <= 2} onClick={() => cq((x) => removeOption(x, k))} aria-label={`Remove answer ${k + 1}`}>
            Remove
          </button>
        </div>
      ))}
      {q.options.length < 5 && (
        <AddButton onClick={() => cq((x) => void x.options.push({ label: "" }))}>+ Add answer</AddButton>
      )}
      <RightAnswer q={q} qe={qe} />
      <Text label="Little note under the answers" max={160} value={q.note} onChange={(v) => cq((x) => void (x.note = v))} />
      <PhotoPicker label="Optional photo next to the question" value={q.photo} onChange={(r) => cq((x) => void (x.photo = r))} {...lib} />
    </>
  );
}

function ImageFields({ q, qe, lib }: { q: Extract<Question, { type: "image" }>; qe: QEdit; lib: PanelProps["lib"] }) {
  const iq = (fn: (x: typeof q) => void) => qe((x) => fn(x as typeof q));
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((o, k) => (
          <div key={k} className="space-y-2 rounded-lg bg-white/70 p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold">Picture {k + 1}</p>
              <button type="button" className="text-xs font-bold text-rose disabled:opacity-30" disabled={q.options.length <= 2} onClick={() => iq((x) => removeOption(x, k))} aria-label={`Remove picture ${k + 1}`}>
                Remove
              </button>
            </div>
            <PhotoPicker label="Photo" value={o.image} onChange={(r) => iq((x) => void (x.options[k]!.image = r))} {...lib} />
            <Text label="Caption" required max={60} value={o.label} onChange={(v) => iq((x) => void (x.options[k]!.label = v))} />
          </div>
        ))}
      </div>
      {q.options.length < 6 && <AddButton onClick={() => iq((x) => void x.options.push({ label: "", image: null }))}>+ Add picture</AddButton>}
      <RightAnswer q={q} qe={qe} />
      <Text label="Note after they choose" max={160} value={q.note} onChange={(v) => iq((x) => void (x.note = v))} />
    </>
  );
}

function SliderFields({ q, qe }: { q: Extract<Question, { type: "slider" }>; qe: QEdit }) {
  const sq = (fn: (x: typeof q) => void) => qe((x) => fn(x as typeof q));
  const names = ["Left end", "Middle", "Right end"];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((k) => (
          <Text key={k} label={`${names[k]} label`} max={30} value={q.labels[k as 0 | 1 | 2]} onChange={(v) => sq((x) => void (x.labels[k as 0 | 1 | 2] = v))} />
        ))}
      </div>
      <p className="text-sm font-bold">Your reply, depending on where they slide</p>
      {[0, 1, 2].map((k) => (
        <Text key={k} label={`Reply for the ${["low", "middle", "high"][k]} third`} max={140} value={q.replies[k as 0 | 1 | 2]} onChange={(v) => sq((x) => void (x.replies[k as 0 | 1 | 2] = v))} />
      ))}
      <Text label="Note before they slide" max={160} value={q.note} onChange={(v) => sq((x) => void (x.note = v))} />
    </>
  );
}

function TextFields({ q, qe, c }: { q: Extract<Question, { type: "text" }>; qe: QEdit; c: LoveContent }) {
  const tq = (fn: (x: typeof q) => void) => qe((x) => fn(x as typeof q));
  return (
    <>
      <Text label="Placeholder in the box" max={60} value={q.placeholder} onChange={(v) => tq((x) => void (x.placeholder = v))} />
      <Text label="Note under the box" max={160} value={q.note} onChange={(v) => tq((x) => void (x.note = v))} />
      <p className={`rounded-lg px-3 py-2 text-xs ${c.responses.collect ? "bg-emerald-50 text-emerald-900" : "bg-cream text-ink-soft"}`}>
        {c.responses.collect
          ? "Their answer will be saved and shown to you on the Share & settings page."
          : "Answers are only shown on their screen and not saved. Turn on “Collect their responses” in the Sections tab to receive them."}
      </p>
    </>
  );
}
