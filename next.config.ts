import type { NextConfig } from "next";

/**
 * Security headers sent with every page.
 * These tell the browser how to protect our users; they cost nothing and
 * are expected of any financial app (and checked in security audits).
 */
const securityHeaders = [
  // Clickjacking protection: no other website may show our pages inside
  // an <iframe> (a classic trick to make users click hidden "Transfer" buttons).
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'", // modern version of X-Frame-Options above
      "base-uri 'self'", // stops injected <base> tags hijacking relative links
      "form-action 'self'", // forms can only submit to our own site
      "object-src 'none'", // no Flash/plugins
    ].join("; "),
  },
  // Don't let the browser guess file types (blocks some script-injection tricks).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // When users follow a link to another site, only share our domain name,
  // never the full URL (which could contain private details).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Turn off browser features we don't use. Camera stays allowed for our own
  // site only (needed later for ID/selfie verification).
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
  // HTTPS only, for 2 years, including subdomains. Browsers ignore this on
  // plain-http localhost, so it's safe in development.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Hide the floating Next.js dev tools button (bottom-left) during `npm run dev`.
  // Build/runtime errors still show as an overlay when they happen.
  devIndicators: false,

  // Don't send the "X-Powered-By: Next.js" header (hides our stack from scanners).
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
