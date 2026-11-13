import { proxyRender } from "@/lib/render";

export async function GET(request, { params }) {
  const { handle, slug } = await params;
  const sp = request.nextUrl.searchParams;
  const themeId = sp.get("themeId");
  return proxyRender(
    handle,
    "product",
    { slug, ...(themeId && { themeId }), ...(sp.get("variant") && { variant: sp.get("variant") }), ...(sp.get("ds") && { ds: sp.get("ds").slice(0, 16) }) },
    request
  );
}
