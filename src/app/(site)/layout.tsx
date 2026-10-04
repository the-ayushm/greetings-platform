import "@/templates/scrapbook/fonts/fonts.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Birthday Surprise — a private, interactive birthday website", template: "%s · Birthday Surprise" },
  description: "Make a scrapbook-style birthday website with your letter, photos, coupons and song. Private link, made in minutes.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fff8ec" };

export default function SiteRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
