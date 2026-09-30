import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Web App Manifest, served at `/manifest.webmanifest`.
 *
 * Lets users install Feenicks1 to their home screen and open it full-screen,
 * like a native app. The browser also uses these colours for its own splash.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: siteConfig.backgroundColor,
    theme_color: siteConfig.themeColor,
    categories: ["finance", "business"],
    icons: [
      // Generated from the logo; the symbol sits inside the "safe zone", so
      // Android can crop it into circles or squircles ("maskable").
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
