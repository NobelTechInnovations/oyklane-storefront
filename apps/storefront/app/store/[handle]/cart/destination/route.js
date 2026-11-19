import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL, CART_COOKIE } from "@/lib/render";
import { apiFetch } from "@/lib/api-url";

/** Checkout: the delivery country, so delivery and duties are priced for it. */
export async function POST(request, { params }) {
  const { handle } = await params;
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE)?.value;
  if (!cartId) return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  let country = "";
  try {
    country = String((await request.json())?.country || "").slice(0, 2);
  } catch {
    /* no body */
  }
  try {
    const res = await apiFetch(`${API_URL}/api/storefront/${handle}/cart/destination`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cartId, country }) });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(res.ok ? { ok: true } : { error: body.error || "Couldn't change the country." }, { status: res.ok ? 200 : res.status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Couldn't change the country." }, { status: 503 });
  }
}
