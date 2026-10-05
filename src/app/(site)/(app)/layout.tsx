import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Full-height column: on short pages the footer stays at the bottom of the screen.
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
