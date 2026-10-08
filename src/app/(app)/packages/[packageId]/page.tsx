import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageDetailsScreen } from "@/features/packages/PackageDetailsScreen";
import { INVESTMENT_PACKAGES, isPackageId } from "@/features/packages/investmentPackages";

/**
 * Route: `/packages/[packageId]`, e.g. `/packages/mfc` (one package's
 * details and returns estimate), during start investing (onboarding).
 * Inside the app: `/invest/[packageId]`. Unknown ids show the 404 page.
 * Private, logged-in users only → hidden from search engines.
 */

type Props = { params: Promise<{ packageId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { packageId } = await params;
  return {
    title: isPackageId(packageId) ? INVESTMENT_PACKAGES[packageId].name : "Portfolio",
    robots: { index: false, follow: false },
  };
}

/** The 4 packages are known in advance, so their pages are pre-built. */
export function generateStaticParams() {
  return Object.keys(INVESTMENT_PACKAGES).map((packageId) => ({ packageId }));
}

export default async function PackageDetailsPage({ params }: Props) {
  const { packageId } = await params;
  if (!isPackageId(packageId)) notFound();
  return <PackageDetailsScreen pkg={INVESTMENT_PACKAGES[packageId]} flow="onboarding" />;
}
