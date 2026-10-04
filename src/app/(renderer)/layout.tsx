import type { Metadata, Viewport } from "next";

// Root layout for every page that shows a birthday experience (demo, owner preview, recipient
// page). Kept separate from the store/dashboard root so the template CSS never meets Tailwind.
export const metadata: Metadata = {
  title: "Your Birthday Surprise ♡",
  description: "Someone made you a birthday surprise ♡",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RendererRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
