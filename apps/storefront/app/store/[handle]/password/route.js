import { NextResponse } from "next/server";
import { apiPost, cookieOptions, redirectTo } from "@/lib/shopper";

const UNLOCK_COOKIE = "sc_unlock";

/** A locked store's password form: the right password unlocks the store in
 * this browser for 30 days; a wrong one comes back with the error. */
export async function POST(request, { params }) {
  const { handle } = await params;
  let password = "";
  try {
    password = String((await request.formData()).get("password") || "").slice(0, 60);
  } catch {
    /* ignore */
  }
  const res = await apiPost(handle, "/unlock", { password });
  if (!res.ok || !res.data?.token) return redirectTo(request, handle, "/", { formError: res.data?.error || "That password isn't right." });
  const response = redirectTo(request, handle, "/");
  response.cookies.set(UNLOCK_COOKIE, res.data.token, cookieOptions(request, handle, 60 * 60 * 24 * 30));
  return response;
}
