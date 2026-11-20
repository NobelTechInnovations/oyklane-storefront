import { apiPost, redirectTo, shopperToken } from "@/lib/shopper";

/** Account page: let Oyklane remember what they browse across Oyklane stores, or stop (and delete it). */
export async function POST(request, { params }) {
  const { handle } = await params;
  const token = await shopperToken();
  if (!token) return redirectTo(request, handle, "/account/login");
  const form = await request.formData();
  const on = form.get("on") === "1";
  const res = await apiPost(handle, "/account/tracking", { on }, { token });
  if (res.status === 401) return redirectTo(request, handle, "/account/login", { formError: "Please sign in again." });
  return redirectTo(request, handle, "/account#details", res.ok ? { notice: on ? "Done. Oyklane will remember what you browse on Oyklane stores." : "Turned off, and what was kept is deleted." } : { formError: res.data?.error || "Couldn't change that." });
}
