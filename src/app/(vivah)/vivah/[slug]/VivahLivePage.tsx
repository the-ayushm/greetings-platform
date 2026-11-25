"use client";

import { useEffect } from "react";
import type { InviteData, InviteStrings } from "@/templates/vivah/adapter";
import { VivahStage } from "@/templates/vivah/Stage";
import { pingView, ReportLink } from "../../../(renderer)/ReportLink";

/** The guest's invitation: the experience plus the view ping and the report link. RSVPs go to the couple's WhatsApp. */
export function VivahLivePage({ slug, data, strings }: { slug: string; data: InviteData; strings: InviteStrings }) {
  useEffect(() => {
    const t = setTimeout(() => pingView(slug), 3000);
    return () => clearTimeout(t);
  }, [slug]);

  return (
    <>
      <VivahStage data={data} strings={strings} />
      <ReportLink slug={slug} />
    </>
  );
}
