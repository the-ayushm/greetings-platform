"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { Button, Notice, formatDate } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";
import type { LoveContent, SectionId } from "@/templates/lovestory/schema";
import { SAVE_LABEL, useDraft, useLibrary, usePreviewBridge } from "../useDraft";
import { DetailsPanel, WelcomePanel } from "./panels/Details";
import { SectionsPanel, ThemePanel } from "./panels/Look";
import { PhotosPanel } from "./panels/Photos";
import { QuestionsPanel } from "./panels/Questions";
import { PhotoWallPanel, ScrapbookPanel, TimelinePanel } from "./panels/Story";
import { CalendarPanel, CouponsPanel, FinalPanel, LetterPanel, UnlockPanel } from "./panels/Words";
import type { PanelProps } from "./types";

type Issue = { path: string; message: string };
type TabId = "details" | "photos" | "welcome" | "questions" | "unlock" | "timeline" | "scrapbook" | "calendar" | "letter" | "coupons" | "photowall" | "final" | "theme" | "sections";

const TABS: { id: TabId; label: string; target: string | null; section?: SectionId; Panel?: ComponentType<PanelProps> }[] = [
  { id: "details", label: "Personal details", target: "welcome", Panel: DetailsPanel },
  { id: "photos", label: "Photos", target: null },
  { id: "welcome", label: "Welcome & music", target: "welcome", Panel: WelcomePanel },
  { id: "questions", label: "Questions", target: "quiz", section: "quiz", Panel: QuestionsPanel },
  { id: "unlock", label: "Unlocking page", target: "unlock", section: "unlock", Panel: UnlockPanel },
  { id: "timeline", label: "Our story", target: "timeline", section: "timeline", Panel: TimelinePanel },
  { id: "scrapbook", label: "Scrapbook", target: "scrapbook", section: "scrapbook", Panel: ScrapbookPanel },
  { id: "calendar", label: "Special dates", target: "calendar", section: "calendar", Panel: CalendarPanel },
  { id: "letter", label: "Love letter", target: "letter", section: "letter", Panel: LetterPanel },
  { id: "coupons", label: "Love coupons", target: "coupons", section: "coupons", Panel: CouponsPanel },
  { id: "photowall", label: "Photo wall", target: "photowall", section: "photowall", Panel: PhotoWallPanel },
  { id: "final", label: "Final surprise", target: "final", Panel: FinalPanel },
  { id: "theme", label: "Theme", target: null, Panel: ThemePanel },
  { id: "sections", label: "Sections & privacy", target: null, Panel: SectionsPanel },
];

const PATH_TAB: Record<string, TabId> = { people: "details", welcome: "welcome", music: "welcome", quiz: "questions", unlock: "unlock", timeline: "timeline", scrapbook: "scrapbook", calendar: "calendar", letter: "letter", coupons: "coupons", photowall: "photowall", final: "final", theme: "theme", sections: "sections", copy: "sections", responses: "sections" };
const NAMES: Record<string, string> = { "people.partnerName": "Their name", "people.creatorName": "Your name", "music.audio": "Song file" };

const describe = (i: Issue) =>
  NAMES[i.path] ??
  `${i.path
    .replace(/\.(\d+)/g, (_, n) => ` #${Number(n) + 1}`)
    .replace(/\./g, " › ")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()}${i.message && i.message !== "Required" ? ` — ${i.message.toLowerCase()}` : ""}`;

type Device = "mobile" | "desktop";
const FRAME: Record<Device, { w: number; h: number }> = { mobile: { w: 390, h: 844 }, desktop: { w: 1280, h: 820 } };

export function LoveStudio({ siteId, initial, initialRevision, status, publishedUrl, editUntil }: { siteId: string; initial: LoveContent; initialRevision: number; status: string; publishedUrl: string | null; editUntil: string }) {
  const [tab, setTab] = useState<TabId>("details");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(status === "published" ? publishedUrl : null);
  const [showPreview, setShowPreview] = useState(false);
  const [device, setDevice] = useState<Device>("mobile");
  const frame = useRef<HTMLIFrameElement>(null);
  const clearIssues = useCallback(() => setIssues([]), []);
  const { c, edit, save, saveNow, notice, setNotice } = useDraft(siteId, initial, initialRevision, clearIssues);
  const { library, loaded, loadLibrary } = useLibrary(siteId);
  const post = usePreviewBridge(frame, c, library);
  const lib = { siteId, library, onUploaded: loadLibrary };
  const current = TABS.find((t) => t.id === tab)!;
  const sectionOn = (id?: SectionId) => !id || c.sections.find((s) => s.id === id)?.enabled !== false;

  /** Moves the preview to the section being edited. */
  const goto = useCallback((target: string | null) => {
    if (target) frame.current?.contentWindow?.postMessage({ type: "lu:goto", target }, window.location.origin);
  }, []);
  const openTab = (id: TabId) => {
    setTab(id);
    goto(TABS.find((t) => t.id === id)?.target ?? null);
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

  const issueTabs = new Set(issues.map((i) => PATH_TAB[i.path.split(".")[0]!]).filter(Boolean));
  const Panel = current.Panel;

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5">
      {/* top bar */}
      <div className="sticky top-0 z-30 -mx-3 mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 bg-cream/95 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5">
        <div className="min-w-0">
          <Link href={`/dashboard/sites/${siteId}`} className="text-sm font-bold underline">
            ← Share & settings
          </Link>
          <p className="font-display text-lg font-semibold leading-tight">Customization studio ♡</p>
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
            This story was changed somewhere else.{" "}
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
              {issues.map((i) => {
                const t = PATH_TAB[i.path.split(".")[0]!];
                return (
                  <li key={i.path}>
                    • {describe(i)}{" "}
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
            {TABS.map((t) => {
              const on = sectionOn(t.section);
              return (
                <li key={t.id} className="shrink-0">
                  <button
                    type="button"
                    aria-current={tab === t.id ? "page" : undefined}
                    onClick={() => openTab(t.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold whitespace-nowrap transition ${tab === t.id ? "bg-rose text-white" : "bg-white text-ink hover:bg-baby"} ${on ? "" : "opacity-60"}`}
                  >
                    <span>{t.label}</span>
                    <span className="text-xs font-normal">
                      {issueTabs.has(t.id) ? <span className={tab === t.id ? "text-white" : "text-rose"}>● fix</span> : !on ? "off" : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* panel */}
        <div id="studio-panel" className="min-w-0 scroll-mt-28">
          {current.section && !sectionOn(current.section) && (
            <div className="mb-3">
              <Notice>
                This page is switched off, so they won&apos;t see it.{" "}
                <button type="button" className="font-bold underline" onClick={() => edit((d) => void (d.sections.find((s) => s.id === current.section)!.enabled = true))}>
                  Switch it on
                </button>
              </Notice>
            </div>
          )}
          {tab === "photos" ? <PhotosPanel c={c} edit={edit} lib={lib} loaded={loaded} /> : Panel ? <Panel c={c} edit={edit} lib={lib} /> : null}
          <div className="mt-4 flex flex-wrap justify-between gap-2">
            {(() => {
              const i = TABS.findIndex((t) => t.id === tab);
              return (
                <>
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
                </>
              );
            })()}
          </div>
        </div>

        {/* live preview */}
        <aside
          className={`${showPreview ? "fixed inset-0 z-50 flex flex-col bg-ink/95 p-3" : "hidden"} xl:sticky xl:top-28 xl:flex xl:h-[calc(100dvh-8rem)] xl:flex-col xl:bg-transparent xl:p-0`}
          aria-label="Live preview"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className={`font-bold ${showPreview ? "text-white" : ""} xl:text-ink`}>Live preview</p>
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-lg border-2 border-ink/20 bg-white p-0.5 text-xs font-bold" role="group" aria-label="Preview size">
                {(["mobile", "desktop"] as const).map((d) => (
                  <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`rounded-md px-2.5 py-1.5 capitalize ${device === d ? "bg-ink text-white" : "text-ink"}`}>
                    {d === "mobile" ? "📱 Mobile" : "🖥 Desktop"}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => goto("welcome")} className="rounded-lg border-2 border-ink/20 bg-white px-2.5 py-1.5 text-xs font-bold text-ink">
                ↺ Start
              </button>
              <a href={`/preview/love/${siteId}`} target="_blank" rel="noopener" className="rounded-lg border-2 border-ink/20 bg-white px-2.5 py-1.5 text-xs font-bold text-ink">
                Full screen ↗
              </a>
              <Button variant="secondary" className="min-h-9 px-3 py-1 text-sm xl:hidden" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </div>
          <div ref={box} className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-ink/5">
            <div
              className={`absolute top-0 left-1/2 origin-top overflow-hidden bg-ink ${device === "mobile" ? "rounded-[2.2rem] border-[10px] border-ink" : "rounded-lg border-4 border-ink"}`}
              style={{ width: FRAME[device].w, height: FRAME[device].h, transform: `translateX(-50%) scale(${scale})` }}
            >
              <iframe ref={frame} src={`/preview/love/${siteId}`} title="Live preview of your love story" className="block size-full bg-[#5c0f22]" onLoad={post} />
            </div>
          </div>
          <p className={`mt-2 text-center text-xs ${showPreview ? "text-white/80" : "text-ink-soft"} xl:text-ink-soft`}>Only you can see this preview. It follows the section you&apos;re editing.</p>
        </aside>
      </div>
    </div>
  );
}
