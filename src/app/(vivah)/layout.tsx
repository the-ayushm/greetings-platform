import type { Metadata, Viewport } from "next";

// Root layout for the Shiv–Parvati invitation pages (demo, owner preview, guest page). Its own
// root so the template's stylesheet (a complete Tailwind build) never mixes with the store's.
export const metadata: Metadata = {
  title: "You're invited ♡",
  description: "A wedding invitation, just for you.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#fbf4f1" };

const A = "/vivah-assets";

export default function VivahRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        {/* the three images the opening screen needs first, and the script font */}
        <link rel="preload" as="image" href={`${A}/illus/shiv-sky.jpg`} />
        <link rel="preload" as="image" href={`${A}/illus/shiv-hand.webp`} />
        <link rel="preload" as="image" href={`${A}/illus/shiv-parvati-step.webp`} />
        <link rel="preload" as="font" type="font/woff2" href={`${A}/fonts/caa3a2e1cccd8315-s.p.0zr6hhvz-h9nw.woff2`} crossOrigin="anonymous" />
        <link rel="stylesheet" href={`${A}/css/fonts.css`} />
        <link rel="stylesheet" href={`${A}/css/aavjoo.css`} />
      </head>
      <body style={{ backgroundColor: "#fbf4f1", margin: 0 }}>{children}</body>
    </html>
  );
}
