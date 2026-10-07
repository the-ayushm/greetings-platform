"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone; out: boolean };

type ToastFn = (message: string, tone?: Tone) => void;
const Ctx = createContext<ToastFn>(() => {});
export const useToast = () => useContext(Ctx);

let _id = 0;

const icons: Record<Tone, string> = { success: "✓", error: "✗", info: "ℹ" };
const styles: Record<Tone, string> = {
  success: "border-emerald-400 bg-emerald-50 text-emerald-800",
  error:   "border-rose bg-red-50 text-rose",
  info:    "border-ink/30 bg-white text-ink",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback<ToastFn>((message, tone = "success") => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, tone, out: false }]);
    // start exit animation after 3s, remove after 3.4s
    setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, out: true } : t)), 3000);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400);
  }, []);

  return (
    <Ctx.Provider value={add}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold shadow-lg",
              "transition-all duration-300",
              t.out ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100",
              styles[t.tone],
            ].join(" ")}
          >
            <span>{icons[t.tone]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
