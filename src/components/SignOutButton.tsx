"use client";

import { useState } from "react";

export function SignOutButton({ className = "rounded-md px-2 py-2 hover:bg-baby" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={`${className} disabled:opacity-50`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/signout", { method: "POST" });
        // Hard navigation on purpose: the session cookie just changed, so every server component must re-read it.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/";
      }}
    >
      Sign out
    </button>
  );
}
