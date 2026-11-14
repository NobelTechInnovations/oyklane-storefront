import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiPost, visitorAllowed } from "@/lib/shopper";
import { VISITOR_COOKIE } from "@/lib/render";

/** Deal Share app (product page): "Share & save" makes the shopper's own
 * link (join); "Use my points" makes their personal discount (redeem).
 * Both need the shopper signed in. JSON in, JSON out. */
export async function POST(request, { params }) {
  const { handle, action } = await params;
  if (!["join", "redeem"].includes(action)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!visitorAllowed(request, `deal-share-${action}`, { max: 30, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "Too many tries from this device. Try again in a few minutes." }, { status: 429 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* empty */
  }
  const jar = await cookies();
  const token = jar.get("sc_customer")?.value;
  if (!token) return NextResponse.json({ error: "Sign in first.", signIn: true }, { status: 401 });
  // The sharer's browser and address: a friend on the same device never
  // counts (the API keeps only a hash of the address).
  const ip = (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "").split(",")[0].trim().slice(0, 64);
  const res = await apiPost(handle, `/apps/deal-share/${action}`, { dealId: String(body.dealId || "").slice(0, 40), via: body.via ? String(body.via).slice(0, 16) : undefined, variantId: body.variantId ? String(body.variantId).slice(0, 40) : undefined, deviceId: jar.get(VISITOR_COOKIE)?.value || undefined, ip }, { token });
  return NextResponse.json(res.data || {}, { status: res.status || (res.ok ? 200 : 400) });
}
