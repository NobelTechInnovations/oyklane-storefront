import { cookies } from "next/headers";
import { SHOPPER_COOKIE, PHONE_TICKET_COOKIE, KEEP_COOKIE, apiPost, clearCookie, clearOyklaneId, redirectTo, setKeepCookie, shopperToken } from "@/lib/shopper";
import { CART_COOKIE } from "@/lib/render";
import { ONE_CLICK_RETURN_COOKIE } from "@/lib/payments";

/** Signs the shopper out of this browser — and empties what belonged to
 * them here: the cart and any checkout in progress, so the next person on
 * this device starts clean. Their Oyklane account is signed out too, so
 * other Oyklane stores don't sign them in again. POST only, so a link or
 * an image on another site can't sign anyone out. */
export async function POST(request, { params }) {
  const { handle } = await params;
  let form = null;
  try {
    form = await request.formData();
  } catch {
    /* no form */
  }
  // "Save my login on this device?" — yes keeps a saved login here (the
  // same number signs in without a code next time); no forgets any.
  const remember = form?.get("remember") === "1";
  const token = await shopperToken();
  const kept = (await cookies()).get(KEEP_COOKIE)?.value;
  let deviceToken = null;
  if (remember && token) {
    const res = await apiPost(handle, "/account/remember", { track: form?.get("track") === "1" }, { token });
    if (res.ok) deviceToken = res.data?.deviceToken || null;
  }
  if (kept && (!remember || deviceToken)) await apiPost(handle, "/account/remembered/forget", { deviceToken: kept }).catch(() => {});
  const response = redirectTo(request, handle, "/", { signedOut: "1", ...(deviceToken && { saved: "1" }) });
  if (deviceToken) setKeepCookie(response, request, handle, deviceToken);
  else if (kept) clearCookie(response, request, handle, KEEP_COOKIE);
  clearCookie(response, request, handle, SHOPPER_COOKIE);
  clearCookie(response, request, handle, PHONE_TICKET_COOKIE);
  clearOyklaneId(response, request);
  response.cookies.set(CART_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(ONE_CLICK_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
