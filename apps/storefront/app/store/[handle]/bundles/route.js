import { proxyRender } from "@/lib/render";

/** Bundles app: every live bundle, each linking to its own page. */
export async function GET(request, { params }) {
  const { handle } = await params;
  return proxyRender(handle, "bundle", {}, request);
}
