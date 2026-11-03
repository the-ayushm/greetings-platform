/** Eyebrow + serif title (+ optional intro) used by every store section. */
export function SectionHeading({ id, eyebrow, title, intro, as = "h2" }: { id?: string; eyebrow?: string; title: string; intro?: string; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <H id={id} className={`mt-2 font-display font-semibold text-wine ${as === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}>
        {title}
      </H>
      {intro && <p className="mt-3 text-lg leading-relaxed text-ink-soft">{intro}</p>}
    </div>
  );
}
