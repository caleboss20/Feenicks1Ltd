import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * robots.txt, served at `/robots.txt`.
 * Tells search engines what they may crawl and where the sitemap is.
 * Add private areas (e.g. "/dashboard") to `disallow` as they're built.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/kyc/"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
