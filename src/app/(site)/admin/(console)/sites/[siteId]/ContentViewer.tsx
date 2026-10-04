"use client";

import { useState } from "react";
import { AdminAction } from "@/components/AdminAction";
import { Card } from "@/components/ui";

/** Content stays hidden until an admin gives a reason; the access is written to the audit log. */
export function ContentViewer({ siteId }: { siteId: string }) {
  const [data, setData] = useState<{ published: unknown; draft: unknown } | null>(null);
  return (
    <Card className="mt-4">
      <h2 className="text-lg font-extrabold">Customer content</h2>
      {!data ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink-soft">Hidden by default. Viewing is recorded with your reason.</p>
          <AdminAction url={`/api/admin/sites/${siteId}/content`} label="View content (audited)" onResult={(r) => setData(r as { published: unknown; draft: unknown })} />
        </div>
      ) : (
        <pre className="mt-3 max-h-[480px] overflow-auto rounded-lg bg-[#faf7f2] p-3 text-xs whitespace-pre-wrap">{JSON.stringify(data.published ?? data.draft, null, 2)}</pre>
      )}
    </Card>
  );
}
