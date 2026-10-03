import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageTermsScreen } from "@/features/packages/PackageTermsScreen";
import { INVESTMENT_PACKAGES, isPackageId } from "@/features/packages/investmentPackages";

/**
 * Route: `/invest/[packageId]/terms`, e.g. `/invest/abc/terms`: the package's
 * Terms & Conditions (the first step of investing), inside the app.
 * Private, logged-in users only → hidden from search engines.
 */

type Props = { params: Promise<{ packageId: string }> };

export const metadata: Metadata = {
  title: "Terms & Conditions",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return Object.keys(INVESTMENT_PACKAGES).map((packageId) => ({ packageId }));
}

export default async function InvestPackageTermsPage({ params }: Props) {
  const { packageId } = await params;
  if (!isPackageId(packageId)) notFound();
  return <PackageTermsScreen pkg={INVESTMENT_PACKAGES[packageId]} flow="app" />;
}
