import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Small shared UI kit for the store, dashboard and admin (Tailwind). */

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const btn = {
  primary: "bg-rose text-white hover:bg-rose-dark shadow-[3px_3px_0_var(--color-pink)]",
  secondary: "bg-white text-ink border-2 border-ink hover:bg-baby shadow-[3px_3px_0_var(--color-ink)]",
  ghost: "text-ink hover:bg-baby",
  danger: "bg-white text-rose border-2 border-rose hover:bg-rose hover:text-white",
};

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: keyof typeof btn }) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-bold transition active:translate-x-0.5 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        btn[variant],
        className,
      )}
    />
  );
}

export function ButtonLink({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: keyof typeof btn }) {
  return (
    <Link
      {...p}
      className={cx("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-bold transition", btn[variant], className)}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("rounded-2xl border-2 border-ink/80 bg-white p-5 shadow-[5px_5px_0_var(--color-blush)]", className)}>{children}</section>;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad"; children: ReactNode }) {
  const t = { neutral: "bg-baby text-ink", good: "bg-emerald-100 text-emerald-800", warn: "bg-amber-100 text-amber-800", bad: "bg-red-100 text-red-800" }[tone];
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide", t)}>{children}</span>;
}

export function PageShell({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return <main className={cx("mx-auto w-full px-4 py-8 sm:px-6", narrow ? "max-w-xl" : "max-w-5xl")}>{children}</main>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const t = { info: "border-lav bg-[#f6effe]", error: "border-rose bg-baby", success: "border-emerald-400 bg-emerald-50" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-xl border-2 px-4 py-3 text-sm", t)}>
      {children}
    </div>
  );
}

export const formatINR = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100);

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—";

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) : "—";
