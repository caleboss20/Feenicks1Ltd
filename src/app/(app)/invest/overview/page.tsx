import type { Metadata, Viewport } from "next";
import { InvestmentOverviewScreen } from "@/features/investment/InvestmentOverviewScreen";

/**
 * Route: `/invest/overview` ("My investment": the current cycle, earnings so
 * far, what's next and past cycles), from a tap on the wallet card or
 * Account › My investment. Private → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "My investment",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f4f4ef",
};

export default function InvestmentOverviewPage() {
  return <InvestmentOverviewScreen />;
}
