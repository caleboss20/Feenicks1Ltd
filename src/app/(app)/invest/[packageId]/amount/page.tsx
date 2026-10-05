import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { InvestAmountScreen } from "@/features/packages/InvestAmountScreen";
import { INVESTMENT_PACKAGES, isPackageId } from "@/features/packages/investmentPackages";

/**
 * Route: `/invest/[packageId]/amount`, e.g. `/invest/investwise/amount`: how
 * much to invest in their package (or add to it), from Invest's Continue.
 * Private, logged-in users only → hidden from search engines.
 */

type Props = { params: Promise<{ packageId: string }> };

export const metadata: Metadata = {
  title: "Invest",
  robots: { index: false, follow: false },
};

/** Status bar in the page's grey (dark in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: GREY_PAGE_COLORS.light,
};

/** The 4 packages are known in advance, so their pages are pre-built. */
export function generateStaticParams() {
  return Object.keys(INVESTMENT_PACKAGES).map((packageId) => ({ packageId }));
}

export default async function InvestAmountPage({ params }: Props) {
  const { packageId } = await params;
  if (!isPackageId(packageId)) notFound();
  return <InvestAmountScreen pkg={INVESTMENT_PACKAGES[packageId]} />;
}
