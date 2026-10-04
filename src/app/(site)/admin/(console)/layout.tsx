import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { requireAdminPage } from "@/server/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

const NAV = [
  ["/admin", "Overview"],
  ["/admin/orders", "Orders"],
  ["/admin/customers", "Customers"],
  ["/admin/sites", "Sites"],
  ["/admin/reports", "Reports"],
  ["/admin/events", "Payment events"],
  ["/admin/catalog", "Templates & pricing"],
  ["/admin/audit", "Audit log"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <div className="min-h-dvh bg-[#faf7f2]">
      <header className="border-b-2 border-ink/15 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="font-pixel text-lg text-rose">Birthday Surprise · Admin</p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-soft">{admin.email} · MFA ✓</span>
            <SignOutButton />
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm font-bold">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-1.5 whitespace-nowrap hover:bg-baby">
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
