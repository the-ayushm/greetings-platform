import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/ui";
import { LEGAL, type LegalDoc } from "./content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const d = LEGAL[(await params).doc as LegalDoc];
  return { title: d?.title ?? "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const d = LEGAL[(await params).doc as LegalDoc];
  if (!d) notFound();
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">{d.title}</h1>
      <p className="mt-1 text-sm text-ink-soft">Last updated: {d.updated}</p>
      <div className="mt-6 space-y-5">
        {d.sections.map(([h, body]) => (
          <section key={h}>
            <h2 className="text-lg font-extrabold">{h}</h2>
            {body.map((p, i) => (
              <p key={i} className="mt-2 leading-relaxed text-ink-soft">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-10 rounded-xl border-2 border-dashed border-pink p-4 text-xs text-ink-soft">
        Template text for the business owner to review with a lawyer before launch. Replace bracketed placeholders with your registered business details.
      </p>
    </PageShell>
  );
}
