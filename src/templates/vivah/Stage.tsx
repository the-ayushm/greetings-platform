"use client";

import { useEffect, useRef, useState } from "react";
import { ASSET_BASE, type InviteData, type InviteStrings } from "./adapter";

/**
 * Mounts the plain-JS invitation runtime (public/vivah-assets/js) into the page. Scripts are
 * added from this (nonce-trusted) bundle, which the CSP's 'strict-dynamic' allows. When `data`
 * changes (studio preview) the invitation is rebuilt in place, already open, at the same scroll
 * position.
 */

type Instance = { goto: (id: string) => void; destroy: () => void; scrollTop: number };
type Runtime = { mount: (el: HTMLElement, data: InviteData, opts: object) => Instance };
declare global {
  interface Window {
    VivahInvite?: Runtime;
  }
}

let loading: Promise<Runtime> | null = null;
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}
function runtime(): Promise<Runtime> {
  if (window.VivahInvite) return Promise.resolve(window.VivahInvite);
  loading ??= loadScript(`${ASSET_BASE}/js/motion.js?v=2`)
    .then(() => loadScript(`${ASSET_BASE}/js/invite.js?v=2`))
    .then(() => window.VivahInvite!)
    .catch((e) => {
      loading = null;
      throw e;
    });
  return loading;
}

export function VivahStage({
  data,
  strings,
  demo = false,
  autoOpen = false,
  jump,
}: {
  data: InviteData;
  strings: InviteStrings;
  demo?: boolean;
  /** Start already open (no tap-to-open cover, no autoplay). */
  autoOpen?: boolean;
  /** Studio: scroll to a section whenever the nonce changes. */
  jump?: { target: string | null; nonce: number };
}) {
  const box = useRef<HTMLDivElement>(null);
  const inst = useRef<Instance | null>(null);
  const mounts = useRef(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    runtime()
      .then((rt) => {
        if (cancelled || !box.current) return;
        const prev = inst.current;
        const keep = prev ? prev.scrollTop : 0;
        prev?.destroy();
        // The first mount honours autoOpen; rebuilds after an edit always start open.
        const open = autoOpen || mounts.current > 0;
        inst.current = rt.mount(box.current, data, { base: ASSET_BASE, demo, autoOpen: open, strings });
        mounts.current++;
        if (keep) inst.current.scrollTop = keep;
        else if (open && jump?.target) inst.current.goto(jump.target);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // jump is handled by its own effect; a rebuild keeps the scroll position instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, strings, demo, autoOpen]);

  useEffect(() => () => inst.current?.destroy(), []);

  useEffect(() => {
    if (jump?.target && jump.nonce > 0) inst.current?.goto(jump.target);
  }, [jump]);

  if (failed)
    return (
      <p style={{ padding: "2rem", textAlign: "center", fontFamily: "Georgia, serif" }}>
        The invitation couldn&apos;t load. Please check your connection and refresh the page.
      </p>
    );
  return <div ref={box} />;
}
