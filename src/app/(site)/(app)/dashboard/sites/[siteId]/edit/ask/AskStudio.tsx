"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { Button, Notice, formatDate } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";
import type { AskContent } from "@/templates/doyouloveme/schema";
import { SAVE_LABEL, useDraft, useLibrary, usePreviewBridge } from "../useDraft";
import { AnswerPanel, FinalePanel, LookPanel, MusicPanel, NoPanel, QuestionPanel, type PanelProps } from "./panels";

type Issue = { path: string; message: string };
type TabId = "question" | "noes" | "finale" | "look" | "music" | "answer";
type Screen = "ask" | "takeover" | "finale";

const TABS: { id: TabId; label: string; target: Screen; Panel: ComponentType<PanelProps> }[] = [
  { id: "question", label: "Names & question", target: "ask", Panel: QuestionPanel },
  { id: "noes", label: "What “No” says", target: "ask", Panel: NoPanel },
  { id: "finale", label: "Celebration", target: "finale", Panel: FinalePanel },
  { id: "look", label: "Look & character", target: "ask", Panel: LookPanel },
  { id: "music", label: "Music & sound", target: "finale", Panel: MusicPanel },
  { id: "answer", label: "Their answer", target: "finale", Panel: AnswerPanel },
];

/** First path segment(s) of a validation issue → the tab that fixes it. */
function tabFor(path: string): TabId | undefined {
  if (path.startsWith("question.noMessages") || path.startsWith("question.takeoverHint")) return "noes";
  const head = path.split(".")[0]!;
  return ({ people: "question", intro: "question", question: "question", finale: "finale", look: "look", theme: "look", music: "music", responses: "answer" } as Record<string, TabId>)[head];
}

const NAMES: Record<string, string> = {
  "people.partnerName": "Their name",
  "people.senderName": "Your name",
  "question.text": "The question",
  "question.yesText": "Yes button",
  "question.noText": "No button",
  "question.noMessages": "What “No” says (at least 3 lines)",
  "finale.heading": "Celebration heading",
  "music.audio": "Song file",
};

const describe = (i: Issue) =>
  NAMES[i.path] ??
  `${i.path
    .replace(/^question\.noMessages\.(\d+)$/, (_, n) => `“No” line ${Number(n) + 1}`)
    .replace(/\.(\d+)/g, (_, n) => ` #${Number(n) + 1}`)
    .replace(/\./g, " › ")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()}${i.message && i.message !== "Required" ? ` — ${i.message.toLowerCase()}` : ""}`;

type Device = "mobile" | "desktop";
const FRAME: Record<Device, { w: number; h: number }> = { mobile: { w: 390, h: 844 }, desktop: { w: 1280, h: 820 } };
const SCREENS: [Screen, string][] = [
  ["ask", "Question"],
  ["takeover", "Big YES"],
  ["finale", "Celebration"],
];

export function AskStudio({ siteId, initial, initialRevision, status, publishedUrl, editUntil }: { siteId: string; initial: AskContent; initialRevision: number; status: string; publishedUrl: string | null; editUntil: string }) {
  const [tab, setTab] = useState<TabId>("question");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(status === "published" ? publishedUrl : null);
  const [showPreview, setShowPreview] = useState(false);
  const [device, setDevice] = useState<Device>("mobile");
  const frame = useRef<HTMLIFrameElement>(null);
  const clearIssues = useCallback(() => setIssues([]), []);
  const { c, edit, save, saveNow, notice, setNotice } = useDraft(siteId, initial, initialRevision, clearIssues);
  const { library, loadLibrary } = useLibrary(siteId);
  const post = usePreviewBridge(frame, c, library);
  const lib = { siteId, library, onUploaded: loadLibrary };
  const current = TABS.find((t) => t.id === tab)!;

  /** Switches the preview to the screen being edited. */
  const goto = useCallback((target: Screen) => {
    frame.current?.contentWindow?.postMessage({ type: "dy:goto", target }, window.location.origin);
  }, []);
  const openTab = (id: TabId) => {
    setTab(id);
    goto(TABS.find((t) => t.id === id)!.target);
    document.getElementById("studio-panel")?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  async function publish() {
    setPublishing(true);
    setIssues([]);
    setNotice(null);
    try {
      await saveNow();
      const r = await api<{ url: string }>(`/api/sites/${siteId}/publish`, { method: "POST" });
      setPublished(r.url);
    } catch (e) {
      if (e instanceof ApiFailure && Array.isArray(e.data.issues)) setIssues(e.data.issues as Issue[]);
      else setNotice(e instanceof ApiFailure ? e.message : "Couldn't publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  // Scale the preview frame to fit its column (desktop preview is a real 1280px-wide page).
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const f = FRAME[device];
      const s = Math.min(el.clientWidth / f.w, el.clientHeight / f.h, 1);
      setScale(s > 0 ? s : 0.5);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device, showPreview]);

  const issueTabs = new Set(issues.map((i) => tabFor(i.path)).filter(Boolean));
  const Panel = current.Panel;
  const i = TABS.findIndex((t) => t.id === tab);

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5">
      {/* top bar */}
      <div className="sticky top-0 z-30 -mx-3 mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 bg-cream/95 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <div className="min-w-0">
          <Link href={`/dashboard/sites/${siteId}`} className="text-sm font-bold underline">
            ← Share & settings
          </Link>
          <p className="font-display text-lg leading-tight font-semibold">“Do You Love Me?” studio ♡</p>
          <p className={`text-sm ${save === "error" || save === "conflict" ? "text-rose" : "text-ink-soft"}`} role="status" aria-live="polite" data-testid="save-state">
            {SAVE_LABEL[save]} · editable until {formatDate(editUntil)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="xl:hidden" onClick={() => setShowPreview(true)}>
            Preview
          </Button>
          <Button onClick={publish} disabled={publishing} data-testid="publish">
            {publishing ? "Publishing…" : published ? "Publish changes" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {save === "conflict" && (
          <Notice tone="error">
            This page was changed somewhere else.{" "}
            <button className="font-bold underline" onClick={() => window.location.reload()}>
              Reload the latest version
            </button>{" "}
            (your last few edits here won&apos;t be kept).
          </Notice>
        )}
        {notice && <Notice tone="error">{notice}</Notice>}
        {issues.length > 0 && (
          <Notice tone="error">
            <p className="font-bold">Almost there — please fix these first:</p>
            <ul className="mt-1 space-y-0.5">
              {issues.map((is) => {
                const t = tabFor(is.path);
                return (
                  <li key={is.path}>
                    • {describe(is)}{" "}
                    {t && (
                      <button type="button" className="font-bold underline" onClick={() => openTab(t)}>
                        Go there
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Notice>
        )}
        {published && (
          <Notice tone="success">
            Published! Your link: <span className="font-mono break-all" data-testid="published-url">{published}</span> ·{" "}
            <Link className="font-bold underline" href={`/dashboard/sites/${siteId}`}>
              Share it
            </Link>
          </Notice>
        )}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_minmax(360px,520px)]">
        {/* section nav */}
        <nav aria-label="Studio sections" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <ul className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {TABS.map((t) => (
              <li key={t.id} className="shrink-0">
                <button
                  type="button"
                  aria-current={tab === t.id ? "page" : undefined}
                  onClick={() => openTab(t.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold whitespace-nowrap transition ${tab === t.id ? "bg-rose text-white" : "bg-white text-ink hover:bg-baby"}`}
                >
                  <span>{t.label}</span>
                  {issueTabs.has(t.id) && <span className={`text-xs font-normal ${tab === t.id ? "text-white" : "text-rose"}`}>● fix</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* panel */}
        <div id="studio-panel" className="min-w-0 scroll-mt-28">
          <Panel c={c} edit={edit} lib={lib} />
          <div className="mt-4 flex flex-wrap justify-between gap-2">
            {i > 0 ? (
              <Button variant="ghost" onClick={() => openTab(TABS[i - 1]!.id)}>
                ← {TABS[i - 1]!.label}
              </Button>
            ) : (
              <span />
            )}
            {i < TABS.length - 1 && (
              <Button variant="secondary" onClick={() => openTab(TABS[i + 1]!.id)}>
                {TABS[i + 1]!.label} →
              </Button>
            )}
          </div>
        </div>

        {/* live preview */}
        <aside
          className={`${showPreview ? "fixed inset-0 z-50 flex flex-col bg-ink/95 p-3" : "hidden"} xl:sticky xl:top-28 xl:flex xl:h-[calc(100dvh-8rem)] xl:flex-col xl:bg-transparent xl:p-0`}
          aria-label="Live preview"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className={`font-bold ${showPreview ? "text-white" : ""} xl:text-ink`}>Live preview</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex rounded-lg border-2 border-ink/20 bg-white p-0.5 text-xs font-bold" role="group" aria-label="Preview size">
                {(["mobile", "desktop"] as const).map((d) => (
                  <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`rounded-md px-2.5 py-1.5 capitalize ${device === d ? "bg-ink text-white" : "text-ink"}`}>
                    {d === "mobile" ? "📱 Mobile" : "🖥 Desktop"}
                  </button>
                ))}
              </div>
              <a href={`/preview/ask/${siteId}`} target="_blank" rel="noopener" className="rounded-lg border-2 border-ink/20 bg-white px-2.5 py-1.5 text-xs font-bold text-ink">
                Full screen ↗
              </a>
              <Button variant="secondary" className="min-h-9 px-3 py-1 text-sm xl:hidden" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Show screen">
            {SCREENS.map(([s, label]) => (
              <button key={s} type="button" onClick={() => goto(s)} className="rounded-full border-2 border-ink/20 bg-white px-3 py-1 text-xs font-bold text-ink hover:bg-baby">
                {label}
              </button>
            ))}
          </div>
          <div ref={box} className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-ink/5">
            <div
              className={`absolute top-0 left-1/2 origin-top overflow-hidden bg-ink ${device === "mobile" ? "rounded-[2.2rem] border-[10px] border-ink" : "rounded-lg border-4 border-ink"}`}
              style={{ width: FRAME[device].w, height: FRAME[device].h, transform: `translateX(-50%) scale(${scale})` }}
            >
              <iframe ref={frame} src={`/preview/ask/${siteId}`} title="Live preview of your Do You Love Me? page" className="block size-full bg-[#ffc4cf]" onLoad={post} />
            </div>
          </div>
          <p className={`mt-2 text-center text-xs ${showPreview ? "text-white/80" : "text-ink-soft"} xl:text-ink-soft`}>Only you can see this preview. Try pressing No in it!</p>
        </aside>
      </div>
    </div>
  );
}
