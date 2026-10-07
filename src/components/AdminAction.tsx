"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDialog } from "@/components/admin/dialog";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

/** A button that optionally asks for confirmation + reason, calls an admin API and refreshes. */
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
  const toast = useToast();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant={variant}
      disabled={busy}
      className="min-h-9 px-3 py-1.5 text-sm"
      onClick={async () => {
        if (confirmText) {
          const ok = await dialog.confirm(confirmText, { destructive: variant === "danger" });
          if (!ok) return;
        }
        let reason: string | null = null;
        if (askReason) {
          reason = await dialog.prompt("Reason (recorded in the audit log):", "e.g. customer request");
          if (!reason || reason.trim().length < 3) return;
        }
        setBusy(true);
        try {
          const r = await api(url, { method, body: { ...body, ...(reason ? { reason: reason.trim() } : {}) } });
          onResult?.(r);
          toast(`${label} — done`, "success");
          router.refresh();
        } catch (e) {
          toast(e instanceof ApiFailure ? e.message : "Something went wrong.", "error");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Working…
        </span>
      ) : label}
    </Button>
  );
}
