import type { Metadata } from "next";
import { WithdrawalStatusScreen } from "@/features/withdraw/WithdrawalStatusScreen";

/**
 * Route: `/withdraw/[withdrawalId]`, e.g. `/withdraw/WD48291736`: a
 * withdrawal request's progress (Requested → Approved → Paid), after
 * "Request withdrawal" and from its notifications. The request is looked up
 * for the logged-in user; an unknown id goes back to Withdraw.
 * Private, logged-in users only → hidden from search engines.
 */

type Props = { params: Promise<{ withdrawalId: string }> };

export const metadata: Metadata = {
  title: "Withdrawal",
  robots: { index: false, follow: false },
};

export default async function WithdrawalStatusPage({ params }: Props) {
  const { withdrawalId } = await params;
  return <WithdrawalStatusScreen id={decodeURIComponent(withdrawalId)} />;
}
