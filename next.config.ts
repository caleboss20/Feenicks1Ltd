import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating Next.js dev tools button (bottom-left) during `npm run dev`.
  // Build/runtime errors still show as an overlay when they happen.
  devIndicators: false,

  // Don't send the "X-Powered-By: Next.js" header (hides our stack from scanners).
  poweredByHeader: false,
};

export default nextConfig;
