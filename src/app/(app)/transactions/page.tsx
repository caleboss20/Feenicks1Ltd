import type { Metadata, Viewport } from "next";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { TransactionsScreen } from "@/features/transactions/TransactionsScreen";

/**
 * Route: `/transactions` (your transaction history). Main tab.
 * Private, logged-in users only → hidden from search engines.
 */
export const metadata: Metadata = {
  title: "Transactions",
  robots: { index: false, follow: false },
};

/** Phone status bar in the page's light grey (dark in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: GREY_PAGE_COLORS.light,
};

export default function TransactionsPage() {
  return <TransactionsScreen />;
}
