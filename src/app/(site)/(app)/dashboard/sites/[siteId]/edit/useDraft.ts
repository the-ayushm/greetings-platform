"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { api, ApiFailure } from "@/lib/api-client";
import type { LibraryAsset } from "./upload";

/** Shared by every template's editor: autosave, the asset library and the live-preview bridge. */

export type SaveState = "saved" | "unsaved" | "saving" | "error" | "conflict" | "offline";

export const SAVE_LABEL: Record<SaveState, string> = {
  saved: "All changes saved",
  unsaved: "Unsaved changes…",
  saving: "Saving…",
  error: "Couldn't save",
  conflict: "Edited in another tab",
  offline: "Offline — will retry",
};

/**
 * Draft state with debounced, sequential autosave and optimistic concurrency (the save only
 * applies on top of the revision this editor loaded). Autosave triggers on real changes only.
 */
export function useDraft<T>(siteId: string, initial: T, initialRevision: number, onChanged?: () => void) {
  const [c, setC] = useState(initial);
  const [save, setSave] = useState<SaveState>("saved");
  const [notice, setNotice] = useState<string | null>(null);
  const revision = useRef(initialRevision);
  const latest = useRef(initial);
  const dirty = useRef(false);
  const inflight = useRef<Promise<void> | null>(null);
  const savedJson = useRef(JSON.stringify(initial));
  const changed = useRef(onChanged);
  useEffect(() => {
    changed.current = onChanged;
  });

  const edit = useCallback((fn: (d: T) => void) => {
    setC((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const flush = useCallback(async (): Promise<void> => {
    if (inflight.current) await inflight.current;
    if (!dirty.current) return;
    dirty.current = false;
    const body = latest.current;
    setSave("saving");
    inflight.current = (async () => {
      try {
        const r = await api<{ revision: number }>(`/api/sites/${siteId}/draft`, { method: "PUT", body: { content: body, revision: revision.current } });
        revision.current = r.revision;
        savedJson.current = JSON.stringify(body);
        setSave(dirty.current ? "unsaved" : "saved");
      } catch (e) {
        dirty.current = true;
        if (e instanceof ApiFailure && e.code === "revision_conflict") setSave("conflict");
        else if (e instanceof ApiFailure && e.status === 0) setSave("offline");
        else {
          setSave("error");
          if (e instanceof ApiFailure) setNotice(e.message);
        }
      } finally {
        inflight.current = null;
      }
    })();
    await inflight.current;
  }, [siteId]);

  useEffect(() => {
    latest.current = c;
    if (JSON.stringify(c) === savedJson.current) return;
    dirty.current = true;
    setSave("unsaved");
    changed.current?.();
    const t = setTimeout(() => void flush(), 900);
    return () => clearTimeout(t);
  }, [c, flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current || inflight.current) e.preventDefault();
    };
    const online = () => void flush();
    addEventListener("beforeunload", warn);
    addEventListener("online", online);
    return () => {
      removeEventListener("beforeunload", warn);
      removeEventListener("online", online);
    };
  }, [flush]);

  /** Forces a save of the latest content (used before publishing). */
  const saveNow = useCallback(async () => {
    dirty.current = true;
    await flush();
  }, [flush]);

  return { c, edit, save, flush, saveNow, notice, setNotice };
}

/** The site's photos/songs with signed preview URLs, refreshed before they expire. */
export function useLibrary(siteId: string) {
  const [library, setLibrary] = useState<LibraryAsset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const loadLibrary = useCallback(async () => {
    try {
      const r = await api<{ assets: LibraryAsset[] }>(`/api/sites/${siteId}/assets`);
      setLibrary(r.assets);
    } catch {
      /* preview just shows placeholders */
    } finally {
      setLoaded(true);
    }
  }, [siteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLibrary();
    const iv = setInterval(loadLibrary, 90 * 60_000);
    return () => clearInterval(iv);
  }, [loadLibrary]);

  return { library, loaded, loadLibrary };
}

/** Sends the draft (and signed media URLs) to the same-origin preview iframe. */
export function usePreviewBridge(frame: RefObject<HTMLIFrameElement | null>, content: unknown, library: LibraryAsset[]) {
  const post = useCallback(() => {
    const media = { images: {} as Record<string, { src: string; srcSet?: string }>, audio: {} as Record<string, { src: string }> };
    for (const a of library) {
      if (!a.src) continue;
      if (a.kind === "image") media.images[a.id] = { src: a.src, srcSet: a.srcSmall ? `${a.srcSmall} 480w, ${a.src} 1200w` : undefined };
      else media.audio[a.id] = { src: a.src };
    }
    frame.current?.contentWindow?.postMessage({ type: "bday:content", content, media }, window.location.origin);
  }, [frame, content, library]);

  useEffect(() => {
    post();
  }, [post]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.source === frame.current?.contentWindow && (e.data as { type?: string })?.type === "bday:ready") post();
    };
    addEventListener("message", onMsg);
    return () => removeEventListener("message", onMsg);
  }, [post, frame]);

  return post;
}
