import type { Metadata, Viewport } from "next";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { ReceiptScreen } from "@/features/transactions/ReceiptScreen";

/**
 * Route: `/transactions/[id]/receipt`, e.g. `/transactions/FX4991600/receipt`:
 * a completed transaction's receipt, with Share and Download. Opened right
 * after a payment is approved (`?new=1`: Back then goes home) and from the
 * transaction's details. Anything not completed shows its details instead.
 * Private, logged-in users only → hidden from search engines.
 */

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

export const metadata: Metadata = {
  title: "Transaction receipt",
  robots: { index: false, follow: false },
};

/** Status bar in the page's grey (dark in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: GREY_PAGE_COLORS.light,
};

export default async function TransactionReceiptPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  return <ReceiptScreen id={decodeURIComponent(id)} isNewPayment={isNew === "1"} />;
}
