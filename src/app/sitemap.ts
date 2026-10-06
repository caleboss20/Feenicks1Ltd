import type { MetadataRoute } from "next";
import { IS_PUBLIC_LAUNCH } from "@/config/launch";
import { siteConfig } from "@/config/site";

/**
 * sitemap.xml, served at `/sitemap.xml`.
 * Lists the public pages we want search engines to index.
 * Add new public routes here as they're built (never private/logged-in pages).
 * Empty until the public launch (config/launch.ts): nothing to list yet.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!IS_PUBLIC_LAUNCH) return [];
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/onboarding`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/sign-up`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];
}
