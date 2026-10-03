import type { PackageId } from "@/features/packages/investmentPackages";

/**
 * A movement of money on the user's account, as listed on the Transactions
 * screen (and stored by the server).
 *
 *   investment  money put into a package (from Mobile Money or a bank)
 *   return      profit paid out from a package
 *   withdrawal  money taken out to Mobile Money or a bank
 *   referral    the reward for a friend who signed up (100 points = GH₵ 100)
 */
export type TransactionType = "investment" | "return" | "withdrawal" | "referral";

export type TransactionStatus = "completed" | "pending" | "failed";

export type Transaction = {
  /** Reference the user can quote to support, e.g. "FX1924211". */
  id: string;
  type: TransactionType;
  /** In GH₵, always positive: the type decides whether it's money in or out. */
  amount: number;
  /** The package invested in or paying the return (investments and returns). */
  packageId?: PackageId;
  /** Where the money came from or went, e.g. "MTN MoMo" (investments and withdrawals). */
  channel?: string;
  status: TransactionStatus;
  /** When it happened (ISO date-time). */
  createdAt: string;
};
