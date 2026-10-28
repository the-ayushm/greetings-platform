"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDialog } from "@/components/admin/dialog";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

type Section = { id: string; enabled: boolean };
const LABEL: Record<string, string> = { quiz: "Questions", unlock: "Unlocking envelope", timeline: "Timeline", scrapbook: "Scrapbook", calendar: "Calendar", letter: "Love letter", coupons: "Coupons", photowall: "Photo wall" };

/** Defaults copied into each NEW love story order. Existing stories are never changed. */
export function LoveDefaults({ sections: initial, preset: initialPreset, presets }: { sections: Section[]; preset: string; presets: [string, string][] }) {
  const router = useRouter();
  const toast = useToast();
  const dialog = useDialog();
  const [sections, setSections] = useState(initial);
  const [preset, setPreset] = useState(initialPreset);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(sections) !== JSON.stringify(initial) || preset !== initialPreset;

  async function save() {
    if (!(await dialog.confirm("Save these defaults? Only orders placed from now on get them — existing stories don't change."))) return;
    setBusy(true);
    try {
      await api("/api/admin/templates/lovestory/defaults", { method: "PATCH", body: { sections, ...(preset !== initialPreset && preset !== "custom" ? { preset } : {}) } });
      toast("Defaults saved", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiFailure ? e.message : "Failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg bg-cream p-3">
      <p className="font-bold">Defaults for new orders</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
        {sections.map((s, i) => (
          <label key={s.id} className="flex items-center gap-1.5">
            <input type="checkbox" className="size-4 accent-rose" checked={s.enabled} onChange={(e) => setSections((all) => all.map((x, k) => (k === i ? { ...x, enabled: e.target.checked } : x)))} />
            {LABEL[s.id] ?? s.id}
          </label>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2">
        Starting theme
        <select value={preset} onChange={(e) => setPreset(e.target.value)} className="rounded-lg border-2 border-ink/20 px-2 py-1">
          {presets.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
          {preset === "custom" && <option value="custom">Custom</option>}
        </select>
      </label>
      <Button variant="secondary" className="mt-3 min-h-9 px-3 py-1.5 text-sm" disabled={!dirty || busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save defaults"}
      </Button>
      <p className="mt-2 text-xs text-ink-soft">Theme presets are designed in code (they ship with the template). Customers can still change everything in their studio.</p>
    </div>
  );
}
