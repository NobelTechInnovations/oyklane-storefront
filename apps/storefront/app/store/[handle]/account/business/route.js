import { apiPost, redirectTo, shopperToken } from "@/lib/shopper";

/** B2B: "Apply for a business account" on the account page. */
export async function POST(request, { params }) {
  const { handle } = await params;
  const token = await shopperToken();
  if (!token) return redirectTo(request, handle, "/account/login");
  const form = await request.formData();
  const body = Object.fromEntries(["company", "gstin", "phone", "note"].map((f) => [f, String(form.get(f) || "").trim()]));
  const res = await apiPost(handle, "/account/business", body, { token });
  if (res.status === 401) return redirectTo(request, handle, "/account/login", { formError: "Please sign in again." });
  return redirectTo(
    request,
    handle,
    "/account",
    res.ok ? { notice: "Thanks. The store will review your business account and email you." } : { formError: res.data?.error || "Couldn't send your request." }
  );
}
