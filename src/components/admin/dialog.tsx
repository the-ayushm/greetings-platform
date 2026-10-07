"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";

type Pending =
  | { kind: "confirm"; message: string; destructive?: boolean; resolve: (v: boolean) => void }
  | { kind: "prompt"; message: string; placeholder?: string; resolve: (v: string | null) => void }
  | null;

type DialogApi = {
  confirm: (message: string, opts?: { destructive?: boolean }) => Promise<boolean>;
  prompt: (message: string, placeholder?: string) => Promise<string | null>;
};

const Ctx = createContext<DialogApi>({
  confirm: () => Promise.resolve(false),
  prompt: () => Promise.resolve(null),
});

export const useDialog = () => useContext(Ctx);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback((message: string, opts?: { destructive?: boolean }) =>
    new Promise<boolean>(resolve => setPending({ kind: "confirm", message, destructive: opts?.destructive, resolve })),
  []);

  const prompt = useCallback((message: string, placeholder?: string) =>
    new Promise<string | null>(resolve => setPending({ kind: "prompt", message, placeholder, resolve })),
  []);

  function close(value: boolean | string | null) {
    pending?.resolve(value as never);
    setPending(null);
  }

  return (
    <Ctx.Provider value={{ confirm, prompt }}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) close(pending.kind === "confirm" ? false : null); }}
        >
          <div className="w-full max-w-sm rounded-2xl border-2 border-ink/80 bg-white p-6 shadow-[6px_6px_0_var(--color-blush)]">
            <p className="font-bold leading-snug">{pending.message}</p>

            {pending.kind === "prompt" && (
              <input
                ref={inputRef}
                autoFocus
                placeholder={pending.placeholder ?? "Type here…"}
                className="mt-4 w-full rounded-lg border-2 border-ink/30 px-3 py-2 text-sm focus:border-rose focus:outline-none"
                onKeyDown={e => {
                  if (e.key === "Enter") close(inputRef.current?.value.trim() ?? null);
                  if (e.key === "Escape") close(null);
                }}
              />
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                className="min-h-9 px-4 py-1.5 text-sm"
                onClick={() => close(pending.kind === "confirm" ? false : null)}
              >
                Cancel
              </Button>
              <Button
                variant={pending.kind === "confirm" && pending.destructive ? "danger" : "primary"}
                className="min-h-9 px-4 py-1.5 text-sm"
                onClick={() => {
                  if (pending.kind === "confirm") close(true);
                  else close(inputRef.current?.value.trim() ?? null);
                }}
              >
                {pending.kind === "confirm" ? (pending.destructive ? "Yes, confirm" : "OK") : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
