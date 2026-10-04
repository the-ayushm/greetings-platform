"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

/** A button that asks for a reason, calls an admin API and refreshes the page. */
export function AdminAction({ url, method = "POST", body = {}, label, confirmText, askReason = true, variant = "secondary", onResult }: {
  url: string;
  method?: string;
  body?: Record<string, unknown>;
  label: string;
  confirmText?: string;
  askReason?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  onResult?: (r: unknown) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <Button
        variant={variant}
        disabled={busy}
        className="min-h-9 px-3 py-1.5 text-sm"
        onClick={async () => {
          if (confirmText && !confirm(confirmText)) return;
          let reason: string | null = null;
          if (askReason) {
            reason = prompt("Reason (recorded in the audit log):");
            if (!reason || reason.trim().length < 3) return;
          }
          setBusy(true);
          setErr(null);
          try {
            const r = await api(url, { method, body: { ...body, ...(reason ? { reason: reason.trim() } : {}) } });
            onResult?.(r);
            router.refresh();
          } catch (e) {
            setErr(e instanceof ApiFailure ? e.message : "Failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "…" : label}
      </Button>
      {err && <span className="mt-1 text-xs text-rose">{err}</span>}
    </span>
  );
}
