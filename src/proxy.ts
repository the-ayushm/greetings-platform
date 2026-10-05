import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge of the app (Next 16 "proxy"):
 *  1. Host routing — the renderer origin serves ONLY /birthday/<slug> and its /api/r/* calls;
 *     the app origin serves everything else and never serves /birthday.
 *  2. Security headers + a per-request CSP nonce (Next applies it to its own scripts).
 *  3. Supabase session refresh on the app origin only. The renderer origin never sees or sets
 *     auth cookies, so customer-written pages can't reach a session even in theory.
 */

const APP = new URL(process.env.APP_ORIGIN ?? "http://app.localhost:3000");
const RENDERER = new URL(process.env.RENDERER_ORIGIN ?? "http://wishes.localhost:3000");
const SUPABASE = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321").origin;
const DEV = process.env.NODE_ENV === "development";
const HTTPS = APP.protocol === "https:";

const RENDERER_PATHS = /^\/(birthday\/[A-Za-z0-9]{1,64}\/?|api\/r\/[a-z-]+|fonts\/[a-f0-9]{16}\.woff2|robots\.txt|favicon\.ico|icon\.svg)$/;

function csp(kind: "app" | "renderer", nonce: string) {
  const script = `'self' 'nonce-${nonce}' 'strict-dynamic'${DEV ? " 'unsafe-eval'" : ""}`;
  const devConnect = DEV ? " ws: http://localhost:* http://*.localhost:*" : "";
  if (kind === "renderer") {
    return [
      "default-src 'none'",
      `script-src ${script}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: ${SUPABASE}`,
      `media-src 'self' ${SUPABASE}`,
      "font-src 'self'",
      `connect-src 'self'${devConnect}`,
      "manifest-src 'self'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      ...(HTTPS ? ["upgrade-insecure-requests"] : []),
    ].join("; ");
  }
  return [
    "default-src 'self'",
    // wasm-unsafe-eval: in-browser HEIC→JPEG conversion (libheif WebAssembly).
    `script-src ${script} 'wasm-unsafe-eval' https://checkout.razorpay.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${SUPABASE} https://*.razorpay.com`,
    `media-src 'self' blob: ${SUPABASE}`,
    "font-src 'self'",
    `connect-src 'self' ${SUPABASE} https://api.razorpay.com https://lumberjack.razorpay.com${devConnect}`,
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    // The editor embeds its own preview page in a same-origin iframe.
    "frame-ancestors 'self'",
    "object-src 'none'",
    ...(HTTPS ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

function baseHeaders(res: NextResponse, kind: "app" | "renderer") {
  const h = res.headers;
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=()");
  if (HTTPS) h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  if (kind === "renderer") {
    h.set("Referrer-Policy", "no-referrer");
    h.set("X-Frame-Options", "DENY");
    h.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
    h.set("Cross-Origin-Opener-Policy", "same-origin");
    h.set("Cross-Origin-Resource-Policy", "same-origin");
  } else {
    h.set("Referrer-Policy", "strict-origin-when-cross-origin");
    h.set("X-Frame-Options", "SAMEORIGIN");
    // Razorpay may open bank/UPI pages in a popup.
    h.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  }
  return res;
}

function notFound(kind: "app" | "renderer") {
  return baseHeaders(new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain", "cache-control": "no-store" } }), kind);
}

export async function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const path = req.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  let kind: "app" | "renderer";
  if (host === RENDERER.host) kind = "renderer";
  else if (host === APP.host) kind = "app";
  else return new NextResponse("Unknown host", { status: 421 });

  if (kind === "renderer" && !RENDERER_PATHS.test(path)) return notFound("renderer");
  if (kind === "app" && (path.startsWith("/birthday") || path.startsWith("/api/r/"))) return notFound("app");

  // If Supabase falls back to the Site URL, the sign-in link lands on "/" — finish it at the callback.
  if (kind === "app" && path === "/" && ["code", "token_hash", "error_code"].some((k) => req.nextUrl.searchParams.has(k))) {
    const to = req.nextUrl.clone();
    to.pathname = "/auth/callback";
    return NextResponse.redirect(to);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = csp(kind, nonce);
  const reqHeaders = new Headers(req.headers);
  // Strip any client-supplied value; only we set these.
  reqHeaders.delete("x-nonce");
  reqHeaders.set("x-surface", kind);
  if (!isApi) {
    reqHeaders.set("x-nonce", nonce);
    reqHeaders.set("Content-Security-Policy", policy);
  }

  let res = NextResponse.next({ request: { headers: reqHeaders } });

  // Keep the Supabase session fresh on the app origin (never on the renderer, never for webhooks).
  if (kind === "app" && !path.startsWith("/api/webhooks/") && !path.startsWith("/api/cron/")) {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      cookieOptions: { sameSite: "lax", secure: HTTPS, path: "/" },
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) req.cookies.set(name, value);
          reqHeaders.set("cookie", req.cookies.toString());
          res = NextResponse.next({ request: { headers: reqHeaders } });
          for (const { name, value, options } of list) res.cookies.set(name, value, options);
        },
      },
    });
    await supabase.auth.getClaims();
  }

  if (!isApi) res.headers.set("Content-Security-Policy", policy);
  // Private pages must never be stored by shared caches or the browser's back/forward cache.
  if (kind === "renderer" && !isApi) res.headers.set("Cache-Control", "private, no-store, max-age=0");
  const privatePage = kind === "renderer" || /^\/(dashboard|admin|preview|login|account)/.test(path);
  if (privatePage) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return baseHeaders(res, kind);
}

export const config = {
  // Every request, prefetches included, goes through host routing.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
