import type { Review } from "@/lib/store";
import { SectionHeading } from "./SectionHeading";

/**
 * Customer reviews — genuine ones only (see REVIEWS in src/lib/store.ts). Renders nothing while
 * there are none: no placeholder names, ratings or numbers are ever shown.
 */
export function Testimonials({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="bg-white/60 py-16" aria-labelledby="reviews">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="reviews" eyebrow="Kind words" title="From people who sent one" />
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <li key={`${r.name}-${r.text.slice(0, 20)}`} className="soft-card p-6">
              <p className="font-display text-4xl leading-none text-rose" aria-hidden="true">
                “
              </p>
              <blockquote className="mt-1 leading-relaxed text-ink">{r.text}</blockquote>
              <p className="mt-4 text-sm font-bold text-wine">
                {r.name}
                {r.product && <span className="font-normal text-ink-soft"> · {r.product}</span>}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
