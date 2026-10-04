import type { Metadata } from "next";
import { DEMO_CONTENT } from "@/templates/scrapbook/defaults";
import { Experience } from "@/templates/scrapbook/Experience";

export const metadata: Metadata = {
  title: "Demo · Birthday Surprise",
  description: "Try the interactive scrapbook birthday website.",
};

const EMPTY_MEDIA = { images: {}, audio: {} };

export default function DemoPage() {
  return <Experience content={DEMO_CONTENT} mode="demo" media={EMPTY_MEDIA} storageKey="demo" />;
}
