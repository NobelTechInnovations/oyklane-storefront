// Security headers on every page: no MIME sniffing, no full URLs leaked to
// other sites, HTTPS remembered, plugins off — framing stays allowed (the
// admin's theme editor and the Oyklane Store preview show it in a frame).
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // See apps/admin/next.config.js — shared-hosting process quotas are far
  // below this host's real core count, so the default one-worker-per-core
  // build kills itself with `spawn ... EAGAIN`.
  experimental: { cpus: 2 },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

module.exports = nextConfig;
