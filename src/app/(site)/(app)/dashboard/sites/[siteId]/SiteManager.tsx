"use client";

import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Notice } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";

type Props = { siteId: string; status: string; url: string | null; hasPasscode: boolean; editable: boolean; disabledReason: string | null };

export function SiteManager({ siteId, status, url: serverUrl, hasPasscode, editable, disabledReason }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  // Shown immediately after a rotation (before the server refresh lands), then kept in sync.
  const [rotated, setRotated] = useState<{ from: string | null; to: string } | null>(null);
  const url = rotated && rotated.from === serverUrl ? rotated.to : serverUrl;
  const live = status === "published" && url;

  useEffect(() => {
    if (!live) return;
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#6a3346", light: "#ffffff" } }).then(setQr, () => setQr(null));
  }, [live, url]);

  async function run(name: string, fn: () => Promise<unknown>, ok: string, after?: (r: unknown) => void) {
    setBusy(name);
    setMsg(null);
    try {
      const r = await fn();
      after?.(r);
      setMsg({ tone: "success", text: ok });
      router.refresh();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiFailure ? e.message : "Something went wrong." });
    } finally {
      setBusy(null);
    }
  }

  const share = `A little birthday surprise, just for you ♡ ${url ?? ""}`;

  return (
    <div className="mt-6 space-y-5">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {status === "disabled" && <Notice tone="error">This site has been disabled{disabledReason ? ` (${disabledReason})` : ""}. Its link doesn&apos;t work anymore.</Notice>}

      <Card>
        <h2 className="text-lg font-extrabold">Your private link</h2>
        {live ? (
          <>
            <p className="mt-2 rounded-lg bg-baby px-3 py-2 font-mono text-sm break-all" data-testid="site-url">
              {url}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(url).catch(() => undefined);
                  setMsg({ tone: "success", text: "Link copied." });
                }}
              >
                Copy link
              </Button>
              <a
                className="inline-flex min-h-11 items-center rounded-lg bg-[#1f8a4c] px-5 py-2.5 font-bold text-white hover:bg-[#176b3b]"
                href={`https://wa.me/?text=${encodeURIComponent(share)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on WhatsApp
              </a>
              <a className="inline-flex min-h-11 items-center rounded-lg px-4 font-bold underline" href={url} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            </div>
            {qr && (
              <div className="mt-4 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR code for your birthday site" width={140} height={140} className="rounded-lg border-2 border-ink/20" />
                <div className="text-sm text-ink-soft">
                  <p>Print it inside a card, or put it on the cake box.</p>
                  <a className="mt-1 inline-block font-bold text-ink underline" href={qr} download="birthday-qr.png">
                    Download QR code
                  </a>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-ink-soft">{status === "draft" ? "Publish from the editor to get your link." : "The link is off right now."}</p>
        )}
        {editable && status === "unpublished" && (
          <Button className="mt-3" disabled={busy !== null} onClick={() => run("publish", () => api(`/api/sites/${siteId}/publish`, { method: "POST" }), "Published again.")}>
            Publish again
          </Button>
        )}
      </Card>

      {["draft", "published", "unpublished"].includes(status) && (
        <Card>
          <h2 className="text-lg font-extrabold">Passcode</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {hasPasscode ? "A passcode is set. They'll need it to open the page." : "Optional. Ask for a 4–8 digit code (like their birthday) before the page opens."}
          </p>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void run("passcode", () => api(`/api/sites/${siteId}/passcode`, { method: "PUT", body: { passcode: code } }), "Passcode saved.").then(() => setCode(""));
            }}
          >
            <label className="sr-only" htmlFor="pc">
              New passcode
            </label>
            <input
              id="pc"
              inputMode="numeric"
              pattern="[0-9]{4,8}"
              maxLength={8}
              placeholder={hasPasscode ? "New code" : "e.g. 1402"}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-36 rounded-lg border-2 border-ink/30 px-3 py-2"
            />
            <Button type="submit" variant="secondary" disabled={busy !== null || code.length < 4}>
              {hasPasscode ? "Change" : "Set passcode"}
            </Button>
            {hasPasscode && (
              <Button type="button" variant="ghost" disabled={busy !== null} onClick={() => run("passcode", () => api(`/api/sites/${siteId}/passcode`, { method: "PUT", body: { passcode: null } }), "Passcode removed.")}>
                Remove
              </Button>
            )}
          </form>
        </Card>
      )}

      {url && ["published", "unpublished"].includes(status) && (
        <Card>
          <h2 className="text-lg font-extrabold">Link controls</h2>
          <p className="mt-1 text-sm text-ink-soft">Shared it with the wrong person? Make a new link — the old one stops working straight away.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={busy !== null}
              onClick={() => {
                if (confirm("Make a new link? The current link will stop working immediately.")) void run("rotate", () => api<{ url: string }>(`/api/sites/${siteId}/rotate-link`, { method: "POST" }), "New link created. The old link no longer works.", (r) => setRotated({ from: serverUrl, to: (r as { url: string }).url }));
              }}
            >
              Make a new link
            </Button>
            {status === "published" && (
              <Button variant="secondary" disabled={busy !== null} onClick={() => run("unpublish", () => api(`/api/sites/${siteId}/unpublish`, { method: "POST" }), "Unpublished. The link is off until you publish again.")}>
                Unpublish
              </Button>
            )}
          </div>
        </Card>
      )}

      {status !== "deleted" && (
        <Card className="border-rose">
          <h2 className="text-lg font-extrabold text-rose">Delete this site</h2>
          <p className="mt-1 text-sm text-ink-soft">Removes your text, photos and song for good. This can&apos;t be undone.</p>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy("delete");
              try {
                await api(`/api/sites/${siteId}`, { method: "DELETE", body: { confirm: "DELETE" } });
                router.push("/dashboard");
                router.refresh();
              } catch (err) {
                setBusy(null);
                setMsg({ tone: "error", text: err instanceof ApiFailure ? err.message : "Couldn't delete." });
              }
            }}
          >
            <label className="sr-only" htmlFor="del">
              Type DELETE to confirm
            </label>
            <input id="del" placeholder="Type DELETE" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} className="w-40 rounded-lg border-2 border-ink/30 px-3 py-2" />
            <Button type="submit" variant="danger" disabled={busy !== null || confirmDelete !== "DELETE"}>
              Delete site
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
