"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

export function CatalogControls({ kind, id, active, pricePaise }: { kind: "template" | "product"; id: string; active: boolean; pricePaise?: number }) {
  const router = useRouter();
  const [price, setPrice] = useState(pricePaise ? String(pricePaise / 100) : "");
  const [err, setErr] = useState<string | null>(null);
  const url = kind === "template" ? `/api/admin/templates/${id}` : `/api/admin/products/${id}`;
  const patch = async (body: Record<string, unknown>) => {
    setErr(null);
    try {
      await api(url, { method: "PATCH", body });
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiFailure ? e.message : "Failed.");
    }
  };
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button variant="secondary" className="min-h-9 px-3 py-1.5 text-sm" onClick={() => patch({ isActive: !active })}>
        {active ? "Deactivate" : "Activate"}
      </Button>
      {kind === "product" && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const rupees = Number(price);
            if (!Number.isFinite(rupees) || rupees < 1) return setErr("Enter a price in rupees.");
            if (confirm(`Set price to ₹${rupees}? New checkouts use it immediately.`)) void patch({ pricePaise: Math.round(rupees * 100) });
          }}
        >
          <label className="text-sm">
            ₹ <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="w-24 rounded-lg border-2 border-ink/20 px-2 py-1" />
          </label>
          <Button variant="secondary" className="min-h-9 px-3 py-1.5 text-sm" type="submit">
            Save price
          </Button>
        </form>
      )}
      {err && <span className="text-xs text-rose">{err}</span>}
    </div>
  );
}
