import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiPost, visitorAllowed } from "@/lib/shopper";

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
  const token = (await cookies()).get("sc_customer")?.value;
  if (!token) return NextResponse.json({ error: "Sign in first.", signIn: true }, { status: 401 });
  const res = await apiPost(handle, `/apps/deal-share/${action}`, { dealId: String(body.dealId || "").slice(0, 40), via: body.via ? String(body.via).slice(0, 16) : undefined }, { token });
  return NextResponse.json(res.data || {}, { status: res.status || (res.ok ? 200 : 400) });
}
