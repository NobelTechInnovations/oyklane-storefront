import { NextResponse } from "next/server";
import { API_URL, apiFetch } from "@/lib/api-url";
import { storefrontPath } from "@/lib/domain";
import { publicUrl } from "@/lib/origin";

/** More reviews for the product page (View more / loading on scroll),
 * 5 at a time, as JSON. */
export async function GET(request, { params }) {
  const { handle, slug } = await params;
  const u = new URL(request.url);
  const offset = Math.max(0, parseInt(u.searchParams.get("offset") || "0", 10) || 0);
  try {
    const res = await apiFetch(`${API_URL}/api/storefront/${encodeURIComponent(handle)}/products/${encodeURIComponent(slug)}/reviews?offset=${offset}&limit=5`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(res.ok ? data : { items: [], hasMore: false }, { status: res.ok ? 200 : res.status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ items: [], hasMore: false }, { status: 502 });
  }
}

/** The product page's "Write a review" form (Product Reviews app): send it
 * to the API, then back to the product with a thank-you or the problem. */
export async function POST(request, { params }) {
  const { handle, slug } = await params;
  const form = await request.formData();
  const body = Object.fromEntries(["rating", "name", "email", "title", "body"].map((k) => [k, String(form.get(k) || "").slice(0, 4000)]));
  let message = null;
  let ok = false;
  try {
    const res = await apiFetch(`${API_URL}/api/storefront/${encodeURIComponent(handle)}/products/${encodeURIComponent(slug)}/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    ok = res.ok;
    message = ok
      ? data.status === "published"
        ? "Thanks — your review is live."
        : "Thanks — your review will appear once the store has checked it."
      : data.error || "Couldn't send your review. Try again.";
  } catch {
    message = "Couldn't send your review. Try again.";
  }
  const target = publicUrl(request, storefrontPath(request.headers.get("host"), handle, `/products/${slug}`));
  target.searchParams.set(ok ? "notice" : "formError", message);
  target.hash = "reviews";
  return NextResponse.redirect(target, { status: 303 });
}
