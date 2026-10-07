"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDialog } from "@/components/admin/dialog";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

export function CatalogControls({ kind, id, active, pricePaise, editDays, liveDays }: {
  kind: "template" | "product";
  id: string;
  active: boolean;
  pricePaise?: number;
  editDays?: number;
  liveDays?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const dialog = useDialog();
  const [price, setPrice] = useState(pricePaise ? String(pricePaise / 100) : "");
  const [editD, setEditD] = useState(editDays ? String(editDays) : "");
  const [liveD, setLiveD] = useState(liveDays ? String(liveDays) : "");
  const [busy, setBusy] = useState<string | null>(null);

  const url = kind === "template" ? `/api/admin/templates/${id}` : `/api/admin/products/${id}`;

  const patch = async (body: Record<string, unknown>, successMsg: string) => {
    setBusy(Object.keys(body)[0] ?? "save");
    try {
      await api(url, { method: "PATCH", body });
      toast(successMsg, "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof ApiFailure ? e.message : "Failed.", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button
        variant={active ? "secondary" : "primary"}
        className="min-h-9 px-3 py-1.5 text-sm"
        disabled={busy === "isActive"}
        onClick={async () => {
          const ok = await dialog.confirm(
            active ? `Deactivate this ${kind}? It will no longer be available in the store.` : `Activate this ${kind}?`,
            { destructive: active },
          );
          if (ok) void patch({ isActive: !active }, active ? "Deactivated" : "Activated");
        }}
      >
        {busy === "isActive" ? <Spinner /> : active ? "Deactivate" : "Activate"}
      </Button>

      {kind === "product" && (
        <>
          <form
            className="flex items-center gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const rupees = Number(price);
              if (!Number.isFinite(rupees) || rupees < 1) { toast("Enter a valid price in rupees.", "error"); return; }
              const ok = await dialog.confirm(`Set price to ₹${rupees}? New checkouts use it immediately.`);
              if (ok) void patch({ pricePaise: Math.round(rupees * 100) }, `Price updated to ₹${rupees}`);
            }}
          >
            <label className="flex items-center gap-1 text-sm font-medium">
              ₹
              <input
                value={price}
                onChange={e => setPrice(e.target.value)}
                inputMode="decimal"
                className="w-24 rounded-lg border-2 border-ink/20 px-2 py-1 text-sm focus:border-rose focus:outline-none"
              />
            </label>
            <Button variant="secondary" className="min-h-9 px-3 py-1.5 text-sm" type="submit" disabled={busy === "pricePaise"}>
              {busy === "pricePaise" ? <Spinner /> : "Save price"}
            </Button>
          </form>

          <form
            className="flex items-center gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const ed = Number(editD);
              const ld = Number(liveD);
              if (!Number.isInteger(ed) || ed < 1) { toast("Edit days must be a whole number ≥ 1.", "error"); return; }
              if (!Number.isInteger(ld) || ld < 1) { toast("Live days must be a whole number ≥ 1.", "error"); return; }
              const ok = await dialog.confirm(`Set edit ${ed} days and live ${ld} days?`);
              if (ok) void patch({ editDays: ed, liveDays: ld }, `Updated: edit ${ed}d, live ${ld}d`);
            }}
          >
            <label className="flex items-center gap-1 text-sm font-medium">
              Edit
              <input value={editD} onChange={e => setEditD(e.target.value)} inputMode="numeric" className="w-16 rounded-lg border-2 border-ink/20 px-2 py-1 text-sm focus:border-rose focus:outline-none" />
            </label>
            <label className="flex items-center gap-1 text-sm font-medium">
              Live
              <input value={liveD} onChange={e => setLiveD(e.target.value)} inputMode="numeric" className="w-16 rounded-lg border-2 border-ink/20 px-2 py-1 text-sm focus:border-rose focus:outline-none" />
            </label>
            <Button variant="secondary" className="min-h-9 px-3 py-1.5 text-sm" type="submit" disabled={busy === "editDays"}>
              {busy === "editDays" ? <Spinner /> : "Save days"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      Saving…
    </span>
  );
}
