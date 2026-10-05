import type { Metadata, Viewport } from "next";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { MomoApprovalScreen } from "@/features/payments/MomoApprovalScreen";

/**
 * Route: `/invest/payment/[paymentId]`, e.g. `/invest/payment/PAY48291736`:
 * waiting for a Mobile Money payment to be approved on the phone (after Pay
 * on the confirm sheet), or why it didn't complete. The payment is looked up
 * for the logged-in user; an unknown id goes back to Invest.
 * Private, logged-in users only → hidden from search engines.
 */

type Props = { params: Promise<{ paymentId: string }> };

export const metadata: Metadata = {
  title: "Approve payment",
  robots: { index: false, follow: false },
};

/** Status bar in the page's grey (dark in dark mode: useStatusBarColor). */
export const viewport: Viewport = {
  themeColor: GREY_PAGE_COLORS.light,
};

export default async function InvestPaymentPage({ params }: Props) {
  const { paymentId } = await params;
  return <MomoApprovalScreen paymentId={decodeURIComponent(paymentId)} />;
}
