import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * robots.txt, served at `/robots.txt`.
 * Tells search engines what they may crawl and where the sitemap is.
 * Add new private areas to `disallow` as they're built.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/kyc/", "/security/", "/dashboard"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
