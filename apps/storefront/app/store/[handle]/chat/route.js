import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL } from "@/lib/render";

/** The store's support chat bubble: questions go to the store's assistant,
 * "Talk to the store" becomes a ticket (Customers ▸ Queries). */
export async function POST(request, { params }) {
  const { handle } = await params;
  const jar = await cookies();
  const token = jar.get("sc_customer")?.value;
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const path = body.action === "ticket" ? "contact" : "chat";
  const payload =
    body.action === "ticket"
      ? { name: String(body.name || "").slice(0, 80), email: String(body.email || "").slice(0, 200), phone: String(body.phone || "").slice(0, 24), message: String(body.message || "").slice(0, 5000) }
      : { messages: Array.isArray(body.messages) ? body.messages.slice(-10) : [], order: body.order || undefined };
  const res = await fetch(`${API_URL}/api/storefront/${encodeURIComponent(handle)}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token && { "x-shopper-token": token }), "x-forwarded-for": request.headers.get("x-forwarded-for") || "" },
    body: JSON.stringify(payload),
  }).catch(() => null);
  if (!res) return NextResponse.json({ error: "Couldn't reach the store. Try again." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
