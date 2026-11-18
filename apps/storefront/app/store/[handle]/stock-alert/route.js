import { NextResponse } from "next/server";
import { apiPost, visitorAllowed } from "@/lib/shopper";

/** "Notify me when it's back" on a sold-out product page (the API's
 * products/stock-alerts.js). JSON in, JSON out. */
export async function POST(request, { params }) {
  const { handle } = await params;
  if (!visitorAllowed(request, "stock-alert", { max: 20, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "Too many tries from this device. Try again in a few minutes." }, { status: 429 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* empty */
  }
  const res = await apiPost(handle, "/stock-alerts", { variantId: String(body.variantId || "").slice(0, 40), email: String(body.email || "").slice(0, 200) });
  return NextResponse.json(res.data || {}, { status: res.status || (res.ok ? 200 : 400) });
}
