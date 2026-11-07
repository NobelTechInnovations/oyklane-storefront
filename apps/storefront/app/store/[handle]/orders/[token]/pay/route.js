import { NextResponse } from "next/server";
import { API_URL } from "@/lib/render";
import { storefrontPath } from "@/lib/domain";
import { storeBase, gatewayHandoff } from "@/lib/payments";

/**
 * Partial payment: "Pay the balance online" on the order page. The API works
 * out what's due and starts the payment; the shopper comes back through the
 * same gateway return route as checkout, which asks the gateway itself.
 */
export async function POST(request, { params }) {
  const { handle, token } = await params;
  const host = request.headers.get("host");
  const orderPath = storefrontPath(host, handle, `/orders/${token}`);
  const back = (message) => {
    const target = new URL(orderPath, request.url);
    if (message) target.searchParams.set("formError", message);
    return NextResponse.redirect(target, { status: 303 });
  };

  let result = null;
  let ok = false;
  try {
    const res = await fetch(`${API_URL}/api/storefront/${encodeURIComponent(handle)}/orders/${encodeURIComponent(token)}/pay-balance`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ returnBase: storeBase(request, handle) }),
      cache: "no-store",
    });
    ok = res.ok;
    result = await res.json().catch(() => null);
  } catch {
    return back("We couldn't start the payment. Please try again.");
  }
  if (!ok) return back(result?.error || "We couldn't start the payment. Please try again.");

  const { order, payment, razorpay } = result;
  if (razorpay) {
    const target = new URL(storefrontPath(host, handle, "/checkout/pay"), request.url);
    target.searchParams.set("order", order.id);
    target.searchParams.set("rzpOrderId", razorpay.orderId);
    target.searchParams.set("amount", String(razorpay.amount));
    target.searchParams.set("key", razorpay.keyId);
    target.searchParams.set("back", orderPath);
    return NextResponse.redirect(target, { status: 303 });
  }
  return payment.kind === "redirect" ? NextResponse.redirect(payment.url, { status: 303 }) : gatewayHandoff(payment, { orderId: order.id, back: orderPath });
}
