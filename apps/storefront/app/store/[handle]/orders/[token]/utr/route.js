import { NextResponse } from "next/server";
import { API_URL } from "@/lib/render";
import { storefrontPath } from "@/lib/domain";

/**
 * "Already paid by UPI?" on the order page: after the store marked a UPI
 * payment as not received, the shopper sends the UPI reference (UTR) for
 * the store to check. Back to the order page either way, with a message.
 */
export async function POST(request, { params }) {
  const { handle, token } = await params;
  const host = request.headers.get("host");
  const orderPath = storefrontPath(host, handle, `/orders/${token}`);
  const back = (key, message) => {
    const target = new URL(orderPath, request.url);
    target.searchParams.set(key, message);
    return NextResponse.redirect(target, { status: 303 });
  };
  const form = await request.formData().catch(() => null);
  const utr = String(form?.get("utr") || "").slice(0, 40);
  let res = null;
  let result = null;
  try {
    res = await fetch(`${API_URL}/api/storefront/${encodeURIComponent(handle)}/orders/${encodeURIComponent(token)}/upi-utr`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ utr }),
      cache: "no-store",
    });
    result = await res.json().catch(() => null);
  } catch {
    return back("formError", "We couldn't send it. Please try again.");
  }
  if (!res.ok) return back("formError", String(result?.error || "We couldn't send it. Please try again.").slice(0, 200));
  return back("notice", "Thanks — the store will check your UPI payment and confirm it.");
}
