import { NextResponse } from "next/server";
import { proxyRender, API_URL } from "@/lib/render";
import { apiFetch } from "@/lib/api-url";
import { storefrontPath } from "@/lib/domain";

/** A shopper's subscription (the link in every subscription email): what
 * comes next, and skip, pause, resume, change or cancel. The unguessable
 * token in the URL is the key, so it works without signing in. */
export async function GET(request, { params }) {
  const { handle, token } = await params;
  const sp = request.nextUrl.searchParams;
  // The render's token parameter carries the subscription's token here.
  return proxyRender(handle, "subscription", { orderToken: token, notice: sp.get("notice") || "", formError: sp.get("formError") || "" }, request);
}

const DONE = {
  skip: "Done. Your next delivery is skipped.",
  pause: "Your subscription is paused.",
  resume: "Your subscription is back on.",
  cancel: "Your subscription is cancelled.",
  frequency: "Saved. Your deliveries follow the new schedule.",
  quantity: "Saved. The new quantity applies from your next delivery.",
};

export async function POST(request, { params }) {
  const { handle, token } = await params;
  const host = request.headers.get("host");
  const back = (key, message) => {
    const target = new URL(storefrontPath(host, handle, `/subscriptions/${token}`), request.url);
    target.searchParams.set(key, message);
    return NextResponse.redirect(target, { status: 303 });
  };
  const form = await request.formData().catch(() => null);
  const action = String(form?.get("action") || "");
  if (!DONE[action]) return back("formError", "Pick what to change.");
  const body = { action, frequency: String(form.get("frequency") || "").slice(0, 20), quantity: Number(form.get("quantity") || 0), reason: String(form.get("reason") || "").slice(0, 200) };
  let res = null;
  let result = null;
  try {
    res = await apiFetch(`${API_URL}/api/storefront/${encodeURIComponent(handle)}/subscriptions/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    result = await res.json().catch(() => null);
  } catch {
    return back("formError", "We couldn't save that. Please try again.");
  }
  if (!res.ok) return back("formError", String(result?.error || "We couldn't save that. Please try again.").slice(0, 200));
  return back("notice", DONE[action]);
}
