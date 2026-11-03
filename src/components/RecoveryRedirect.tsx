"use client";

import { useEffect } from "react";

/**
 * Safety net: if `<app>/reset-password` isn't in Supabase's allowed Redirect URLs, Supabase sends
 * the reset link to the Site URL ("/") instead, with the tokens in the fragment. Forward it.
 */
export function RecoveryRedirect() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("type") === "recovery" || (hash.get("error_code") && hash.get("error_description")?.toLowerCase().includes("link"))) {
      window.location.replace(`/reset-password${window.location.hash}`);
    }
  }, []);
  return null;
}
