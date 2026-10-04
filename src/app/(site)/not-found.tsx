import { ButtonLink, PageShell } from "@/components/ui";

export default function SiteNotFound() {
  return (
    <PageShell narrow>
      <p className="font-hand text-3xl text-rose">hmm…</p>
      <h1 className="font-display text-3xl font-semibold">We couldn&apos;t find that page</h1>
      <ButtonLink href="/" className="mt-6">
        Go home
      </ButtonLink>
    </PageShell>
  );
}
