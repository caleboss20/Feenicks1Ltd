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
  /** Returns only: how the amount was worked out (see ReturnBreakdown). */
  breakdown?: ReturnBreakdown;
};

/**
 * How a return was worked out, so anyone can check it:
 *
 *   gross profit = amount invested × monthly rate × months
 *   fee          = gross profit × the package's management fee %
 *   paid         = gross profit − fee                 (= Transaction.amount)
 *
 * e.g. GH₵ 1,500 × 7.5% × 1 month = GH₵ 112.50; 4% fee = GH₵ 4.50; paid GH₵ 108.00.
 * TODO(api): the server stores this with each return (the declared rate for the period).
 */
export type ReturnBreakdown = {
  /** The amount invested that earned it, in GH₵. */
  principal: number;
  /** The monthly rate applied, in % (before the fee). */
  monthlyRatePercent: number;
  /** How many months it covers (the package's payout period). */
  months: number;
  /** Profit before the fee, in GH₵. */
  grossProfit: number;
  /** The management fee taken (a % of the profit), in GH₵. */
  fee: number;
  /** That fee, in %. */
  feePercent: number;
};
