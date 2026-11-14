import { NextResponse } from "next/server";
import { apiPost, visitorAllowed } from "@/lib/shopper";

/** "Report this store" from the seller badge under the footer. JSON in,
 * JSON out. The API keeps only a hash of the address (for repeat reports). */
export async function POST(request, { params }) {
  const { handle } = await params;
  if (!visitorAllowed(request, "trust-report", { max: 5, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: "Too many reports from this device. Try again later." }, { status: 429 });
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* empty */
  }
  const ip = (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "").split(",")[0].trim().slice(0, 64);
  const res = await apiPost(handle, "/trust/report", {
    reason: String(body.reason || "").slice(0, 40),
    details: String(body.details || "").slice(0, 1000),
    email: String(body.email || "").slice(0, 200),
    ip,
  });
  return NextResponse.json(res.data || {}, { status: res.status || (res.ok ? 200 : 400) });
}
