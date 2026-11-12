import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { proxyRender, CART_COOKIE } from "@/lib/render";
import { apiPost, visitorAllowed } from "@/lib/shopper";
import { storefrontPath } from "@/lib/domain";
import { setCartCookie, parkCart, PARKED_COOKIE } from "@/lib/cart-actions";

/** Bundles app: one bundle's page — pick the items for the box. */
export async function GET(request, { params }) {
  const { handle, code } = await params;
  const themeId = request.nextUrl.searchParams.get("themeId");
  return proxyRender(handle, "bundle", { slug: code, ...(themeId && { themeId }) }, request);
}

/** "Buy this box": the box becomes a cart of its own and goes straight to
 * checkout at the bundle price. The shopper's own cart is set aside and
 * comes back once they add anything else or the order is placed. */
export async function POST(request, { params }) {
  const { handle, code } = await params;
  if (!visitorAllowed(request, `bundle:${handle}`, { max: 20, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "Too many tries. Please wait a minute and try again." }, { status: 429 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* empty body → the API says what's missing */
  }
  // The One-Click popup closed without an order: back to their own cart.
  if (body.leave) {
    const parked = (await cookies()).get(PARKED_COOKIE)?.value;
    const response = NextResponse.json({ ok: true });
    if (parked) {
      if (parked === "-") response.cookies.set(CART_COOKIE, "", { path: "/", maxAge: 0 });
      else setCartCookie(response, parked);
      response.cookies.set(PARKED_COOKIE, "", { path: "/", maxAge: 0 });
    }
    return response;
  }
  const res = await apiPost(handle, `/bundles/${encodeURIComponent(String(code).slice(0, 40))}/cart`, { items: Array.isArray(body.items) ? body.items.slice(0, 20) : [] });
  const cartId = res.data?.cart?.cartId;
  if (!res.ok || !cartId) return NextResponse.json({ error: res.data?.error || "Your box couldn't be checked out. Please try again." }, { status: res.ok ? 502 : res.status });
  const jar = await cookies();
  const response = NextResponse.json({ url: storefrontPath(request.headers.get("host"), handle, "/checkout") });
  // Already parked (an earlier box): that's still the shopper's own cart.
  if (!jar.get(PARKED_COOKIE)?.value) parkCart(response, jar.get(CART_COOKIE)?.value);
  setCartCookie(response, cartId);
  return response;
}
