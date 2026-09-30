import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

/* ---------------------------------------------------------------------------
   Fonts: self-hosted by next/font at build time (no request to Google at
   runtime, no layout shift). Exposed as CSS variables used in globals.css.
   --------------------------------------------------------------------------- */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ---------------------------------------------------------------------------
   Default SEO metadata, inherited by every page.
   A page can override any field by exporting its own `metadata`, e.g.
   `export const metadata = { title: "Login" }` → "Login | Feenicks1".
   Icons, the manifest and Open Graph images are picked up automatically
   from the file conventions in this folder (icon.png, apple-icon.png,
   opengraph-image.png, manifest.ts).
   --------------------------------------------------------------------------- */
export const metadata: Metadata = {
  // Base for resolving relative URLs (OG images, canonical) into absolute ones.
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name}: Invest smarter`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
  // Makes "Add to Home Screen" on iOS open like a native app (no Safari bars).
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "black-translucent",
  },
  // Stop iOS from turning numbers (balances, amounts) into phone links.
  formatDetection: { telephone: false },
};

/* ---------------------------------------------------------------------------
   Viewport: `viewportFit: "cover"` lets the UI extend under the notch and
   home indicator (we pad with env(safe-area-inset-*) where needed).
   Zoom is intentionally NOT disabled, for accessibility.
   --------------------------------------------------------------------------- */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: siteConfig.themeColor,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
