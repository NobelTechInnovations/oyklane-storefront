import { API_URL } from "@/lib/render";
import { apiFetch } from "@/lib/api-url";

/** sitemap.xml: every live product, collection, page and blog post. */
export async function GET(request, { params }) {
  const { handle } = await params;
  const res = await apiFetch(`${API_URL}/api/storefront/${handle}/sitemap.xml`, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return new Response("Not found", { status: 404 });
  return new Response(await res.text(), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=900" } });
}
