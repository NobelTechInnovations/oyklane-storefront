import { apiPost, redirectTo, shopperToken } from "@/lib/shopper";

/** Loyalty: "Get a code" on the account page's Points tab. */
export async function POST(request, { params }) {
  const { handle } = await params;
  const token = await shopperToken();
  if (!token) return redirectTo(request, handle, "/account/login");
  const form = await request.formData();
  const points = Math.trunc(Number(form.get("points") || 0));
  const res = await apiPost(handle, "/account/points", { points }, { token });
  if (res.status === 401) return redirectTo(request, handle, "/account/login", { formError: "Please sign in again." });
  if (!res.ok) return redirectTo(request, handle, "/account#points", { formError: res.data?.error || "Couldn't make your code." });
  const d = res.data || {};
  const until = d.endsAt ? new Date(d.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
  return redirectTo(request, handle, "/account#points", { notice: `Your code ${d.code} takes ${d.value} off your next order${until ? ` (use it by ${until})` : ""}. Enter it at checkout.` });
}
