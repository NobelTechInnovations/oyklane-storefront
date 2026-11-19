import { isPlatformHost, subdomainHandle, ROOT_DOMAIN } from "@/lib/domain";
import { API_URL, apiFetch } from "@/lib/api-url";

/**
 * Asked by the server's HTTPS proxy (Caddy's on-demand TLS, see
 * deploy/aws.md) before it gets a certificate for an address it hasn't
 * seen: 200 when this storefront serves it — a store's {handle}.<root>
 * address, a seller's connected domain (or its www.), or go.<root> —
 * and 404 otherwise, so no certificate is requested for random names.
 */
export const dynamic = "force-dynamic";

const answer = (yes) => new Response(null, { status: yes ? 200 : 404, headers: { "cache-control": "no-store" } });

export async function GET(request) {
  const host = String(request.nextUrl.searchParams.get("domain") || "").trim().toLowerCase().replace(/\.$/, "");
  if (!host || host.length > 253 || !/^[a-z0-9.-]+$/.test(host)) return answer(false);
  if (ROOT_DOMAIN !== "localhost" && host === `go.${ROOT_DOMAIN}`) return answer(true);
  if (isPlatformHost(host)) return answer(false);
  try {
    const handle = subdomainHandle(host);
    if (handle) {
      // Only a store that exists (robots.txt is the API's lightest store page).
      const res = await apiFetch(`${API_URL}/api/storefront/${encodeURIComponent(handle)}/robots.txt`, { cache: "no-store" });
      return answer(res.ok);
    }
    if (ROOT_DOMAIN !== "localhost" && host.endsWith(`.${ROOT_DOMAIN}`)) return answer(false);
    const res = await apiFetch(`${API_URL}/api/storefront/resolve-domain?domain=${encodeURIComponent(host)}`, { cache: "no-store" });
    return answer(res.ok);
  } catch {
    return answer(false);
  }
}
