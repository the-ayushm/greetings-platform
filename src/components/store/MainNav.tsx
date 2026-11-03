"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Item = { href: string; label: string };

const PRIMARY: Item[] = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Explore Products" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
];

function isActive(path: string, href: string) {
  if (href.includes("#")) return false;
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`) || (href === "/products" && path.startsWith("/categories"));
}

/** Store navigation: inline links on wide screens, a menu panel on phones. */
export function MainNav({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const account: Item[] = signedIn
    ? [
        { href: "/dashboard", label: "My Sites" },
        { href: "/dashboard/account", label: "Account" },
      ]
    : [];

  // Close the panel on navigation and on Escape.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  const link = (i: Item, mobile = false) => {
    const active = isActive(path, i.href);
    return (
      <Link
        key={i.href}
        href={i.href}
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen(false)}
        className={
          mobile
            ? `block rounded-xl px-4 py-3 text-base font-bold ${active ? "bg-baby text-rose" : "text-wine hover:bg-baby"}`
            : `relative rounded-lg px-3 py-2 text-sm font-bold whitespace-nowrap transition ${active ? "text-rose" : "text-wine/80 hover:text-wine"} after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-rose after:transition ${active ? "after:opacity-100" : "after:opacity-0"}`
        }
      >
        {i.label}
      </Link>
    );
  };

  const cta = signedIn ? null : (
    <Link href="/login" className="inline-flex min-h-10 items-center rounded-xl bg-wine px-4 text-sm font-bold whitespace-nowrap text-white transition hover:bg-rose">
      Sign in
    </Link>
  );
  const admin = isAdmin ? (
    <Link href="/admin" className="inline-flex min-h-10 items-center rounded-xl border border-wine/25 px-3 text-sm font-bold text-wine hover:bg-baby">
      Admin
    </Link>
  ) : null;

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
        {[...PRIMARY, ...account].map((i) => link(i))}
      </nav>
      <div className="hidden items-center gap-2 lg:flex">
        {admin}
        {cta}
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        {cta}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid size-11 place-items-center rounded-xl border border-wine/15 text-wine hover:bg-baby"
          data-testid="menu-button"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />}
          </svg>
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full z-40 border-b border-wine/10 bg-ivory px-4 pt-2 pb-5 shadow-[0_20px_30px_-20px_rgba(74,29,44,.35)] backdrop-blur lg:hidden">
          <nav aria-label="Main" className="mx-auto max-w-6xl space-y-1">
            {[...PRIMARY, ...account].map((i) => link(i, true))}
            {isAdmin && link({ href: "/admin", label: "Admin" }, true)}
          </nav>
        </div>
      )}
    </>
  );
}
