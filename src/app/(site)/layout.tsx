import "@/templates/scrapbook/fonts/fonts.css";
import "./globals.css";
import { FontPreload } from "@/templates/scrapbook/FontPreload";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Digital Gifting — personalised interactive websites & digital gifts", template: "%s · Digital Gifting" },
  description: "Personalised interactive websites and digital gifts — birthday surprises, love stories, romantic questions and wedding invitations, shared as one private link.",
  applicationName: "Digital Gifting",
  openGraph: { siteName: "Digital Gifting", type: "website", locale: "en_IN" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fff8ec" };

export default function SiteRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <FontPreload />
        {children}
      </body>
    </html>
  );
}
