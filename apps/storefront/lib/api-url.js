/**
 * Where the storefront reaches the API (API_INTERNAL_URL).
 *
 * A plain-http address on a public host is upgraded to https: the API's
 * host redirects http → https, and fetch re-sends a redirected POST as a
 * GET — so add to cart, checkout and sign-in would all hit "Not Found"
 * while pages (GETs) still worked. Local and private-network addresses
 * (localhost, 10.x, *.internal such as Railway's private network) stay as
 * they are. A trailing slash is dropped so paths don't double up.
 */
const LOCAL = /^http:\/\/(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\]|[^/:]+\.internal(?::|\/|$)|[^/.:]+(?::|\/|$))/i;

export function normalizeApiUrl(raw) {
  let url = String(raw || "").trim().replace(/\/+$/, "") || "http://localhost:4100";
  if (/^http:\/\//i.test(url) && !LOCAL.test(url)) url = url.replace(/^http:/i, "https:");
  return url;
}

export const API_URL = normalizeApiUrl(process.env.API_INTERNAL_URL);

/**
 * fetch to the API from the storefront's server. Adds the shared secret
 * (STOREFRONT_API_SECRET, set to the same value here and on the API): with
 * it set on the API, shopper-API calls without it — a script hitting cart,
 * checkout or sign-in codes directly — are turned away. Empty: nothing sent.
 */
export function apiFetch(url, init = {}) {
  const secret = process.env.STOREFRONT_API_SECRET;
  if (!secret) return fetch(url, init);
  const headers = new Headers(init.headers || {});
  headers.set("x-storefront-secret", secret);
  return fetch(url, { ...init, headers });
}
