import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL, CART_COOKIE, moneyHeaders } from "@/lib/render";
import { apiFetch } from "@/lib/api-url";
import { publicCart } from "@/lib/cart-actions";

/** The visitor's cart as JSON, for the cart drawer. */
export async function GET(request, { params }) {
  const { handle } = await params;
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE)?.value;
  if (!cartId) return NextResponse.json({ cart: { items: [], item_count: 0, subtotal: 0, total: 0 } }, { headers: { "cache-control": "no-store" } });
  try {
    const res = await apiFetch(`${API_URL}/api/storefront/${handle}/cart?cartId=${encodeURIComponent(cartId)}`, { cache: "no-store", headers: moneyHeaders(request, cookieStore) });
    const body = await res.json();
    if (!res.ok) return NextResponse.json({ error: body.error || "Cart unavailable" }, { status: res.status });
    return NextResponse.json({ cart: publicCart(body.cart, request, handle) }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Cart unavailable" }, { status: 503 });
  }
}
