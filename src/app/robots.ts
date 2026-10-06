import type { MetadataRoute } from "next";
import { IS_PUBLIC_LAUNCH } from "@/config/launch";
import { siteConfig } from "@/config/site";

/**
 * robots.txt, served at `/robots.txt`.
 * Tells search engines what they may crawl and where the sitemap is.
 * Add new private areas to `disallow` as they're built.
 *
 * Test version (config/launch.ts): no sitemap is offered, and every page
 * carries "noindex" (root layout). Crawling stays allowed on purpose: a
 * search engine has to read a page to see its "don't list me".
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/kyc/", "/security/", "/dashboard"] },
    ...(IS_PUBLIC_LAUNCH ? { sitemap: `${siteConfig.url}/sitemap.xml` } : {}),
  };
}
