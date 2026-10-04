export const dynamic = "force-dynamic";

/** Store pages are indexable; the dashboard, admin, preview and the whole renderer origin are not. */
export function GET(req: Request) {
  const surface = req.headers.get("x-surface");
  const body =
    surface === "renderer"
      ? "User-agent: *\nDisallow: /\n"
      : "User-agent: *\nAllow: /$\nAllow: /demo\nAllow: /product\nAllow: /legal/\nAllow: /contact\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /preview\nDisallow: /checkout\nDisallow: /login\nDisallow: /api/\n";
  return new Response(body, { headers: { "content-type": "text/plain", "cache-control": "public, max-age=3600" } });
}
