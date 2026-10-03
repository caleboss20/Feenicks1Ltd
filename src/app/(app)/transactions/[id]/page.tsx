import type { Metadata, Viewport } from "next";
import { TransactionDetailsScreen } from "@/features/transactions/TransactionDetailsScreen";

/**
 * Route: `/transactions/[id]`, e.g. `/transactions/SMP1182137`: one
 * transaction's details, from Transactions and the dashboard's Recent
 * activity. The transaction is looked up in the browser (it's the user's
 * own); an unknown id shows "Transaction not found".
 * Private, logged-in users only → hidden from search engines.
 */

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Transaction details",
  robots: { index: false, follow: false },
};

/** Status bar in the page's colour: white (black in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function TransactionDetailsPage({ params }: Props) {
  const { id } = await params;
  return <TransactionDetailsScreen id={decodeURIComponent(id)} />;
}
