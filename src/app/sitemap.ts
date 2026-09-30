import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * sitemap.xml, served at `/sitemap.xml`.
 * Lists the public pages we want search engines to index.
 * Add new public routes here as they're built (never private/logged-in pages).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
