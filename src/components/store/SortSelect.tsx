"use client";

import { SORTS, type SortId } from "@/lib/store";

/** Sort dropdown inside the Explore GET form: submits on change (the form's button covers no-JS). */
export function SortSelect({ value }: { value: SortId }) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-wine">
      Sort by
      <select name="sort" defaultValue={value} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="min-h-11 rounded-xl border border-wine/15 bg-white px-3 font-semibold">
        {SORTS.map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
