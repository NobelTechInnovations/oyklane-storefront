import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL, VISITOR_COOKIE } from "@/lib/render";

/** Live view check-in from an open store tab (every 45s while visible):
 * the visit, the page, whether One-Click Checkout is open, who they are if
 * signed in, and — once — that a person is using the page (`human`), so
 * bots stay out of Live view and analytics. Never fails the page. */
export async function POST(request, { params }) {
  const { handle } = await params;
  const jar = await cookies();
  const visitorId = jar.get(VISITOR_COOKIE)?.value;
  if (!visitorId) return new NextResponse(null, { status: 204 });
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* ignore */
  }
  const token = jar.get("sc_customer")?.value;
  await fetch(`${API_URL}/api/storefront/${handle}/live`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token && { "x-shopper-token": token }) },
    body: JSON.stringify({ visitorId, path: typeof body.path === "string" ? body.path.slice(0, 300) : null, checkout: Boolean(body.checkout), human: body.human === true, ua: request.headers.get("user-agent") || "" }),
  }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
