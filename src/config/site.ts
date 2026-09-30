/**
 * Site-wide configuration.
 *
 * Single source of truth for brand and SEO values. Metadata, the web app
 * manifest, robots.txt, the sitemap and social share images all read from
 * here, so a change in this file updates every one of them.
 */
export const siteConfig = {
  name: "Feenicks1",
  /** Short tagline, used in page titles and share cards. */
  // tagline: "Smart investing, simplified",
  description:
    "Feenicks1 is a modern investment platform. Grow your wealth, track your portfolio and manage your money securely — all in one app.",
  /**
   * Canonical public URL, used to build absolute links for SEO
   * (Open Graph images, sitemap, canonical tags).
   * Set NEXT_PUBLIC_SITE_URL in `.env.local` / your hosting provider.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  keywords: [
    "investment",
    "investing app",
    "portfolio",
    "wealth management",
    "stocks",
    "fintech",
    "Feenicks1",
  ],
  /** Browser UI / PWA colour. Keep in sync with `--color-brand-600` in globals.css. */
  themeColor: "#13934f",
  /** Splash background colour used by the installed PWA. */
  backgroundColor: "#13934f",
} as const;
