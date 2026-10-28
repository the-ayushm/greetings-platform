import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";

// Root layout for the wedding invitation pages (demo, owner preview, guest page). Separate from
// the birthday/love renderer layout so a guest's phone only fetches the two wedding fonts.
export const metadata: Metadata = {
  title: "You're invited ♡",
  description: "A wedding invitation, just for you.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#351018" };

/** Latin files of Pinyon Script and Cormorant Garamond (same files fonts.css points at). */
const LATIN = ["0451ffb02b41e4a9", "d9ec821052ff94a7"];

export default function WeddingRootLayout({ children }: { children: React.ReactNode }) {
  for (const f of LATIN) preload(`/fonts/${f}.woff2`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
