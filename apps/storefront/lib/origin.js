/**
 * The address the shopper is on. Behind the HTTPS proxy (Caddy on AWS),
 * `request.url` is the app's own http://localhost:3000, so redirects and
 * sign-in return links are built from the forwarded host and scheme.
 */
export function publicOrigin(request) {
  const h = request.headers;
  const host = String(h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  if (!host) return new URL(request.url).origin;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) || host.endsWith(".localhost");
  const proto = String(h.get("x-forwarded-proto") || "").split(",")[0].trim() || (local ? "http" : "https");
  return `${proto}://${host}`;
}

/** `path` on the shopper's own address. */
export function publicUrl(request, path) {
  return new URL(path, publicOrigin(request));
}
