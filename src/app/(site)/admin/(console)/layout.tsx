import type { Metadata } from "next";
import { SignOutButton } from "@/components/SignOutButton";
import { DialogProvider } from "@/components/admin/dialog";
import { ToastProvider } from "@/components/admin/toast";
import { requireAdminPage } from "@/server/auth";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <ToastProvider>
      <DialogProvider>
        <div className="min-h-dvh bg-[#faf7f2]">
          <header className="border-b-2 border-ink/15 bg-white shadow-sm">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="font-pixel text-lg text-rose">Birthday Surprise · Admin</p>
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  {admin.email} · MFA ✓
                </span>
                <SignOutButton className="rounded-md px-3 py-1.5 text-sm font-bold hover:bg-baby border-2 border-ink/20" />
              </div>
            </div>
            <AdminNav />
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
      </DialogProvider>
    </ToastProvider>
  );
}
