import { INVESTMENT_PACKAGES, roiRangeLabel } from "@/features/packages/investmentPackages";
import type { MomoPayment } from "@/features/payments/paymentModel";
import { WITHDRAWAL_KIND_LABELS, type WithdrawalRequest } from "@/features/withdraw/withdrawalModel";
import { formatLocalNumber, MOMO_NETWORKS } from "@/lib/mobileMoney";
import { formatCedis } from "@/lib/money";
import type { Transaction } from "./transactionModel";

/**
 * What a receipt says, worked out once and used twice: on the receipt
 * screen (ReceiptScreen) and in the image they can download or share
 * (receiptImage). So the two can never disagree.
 */

export type ReceiptRow = {
  label: string;
  value: string;
  /** The transaction reference: shown with a copy button. */
  isReference?: boolean;
  /** The bottom line (Total paid…): a little bolder. */
  isTotal?: boolean;
};

export type ReceiptSection = { title: string; rows: ReceiptRow[] };

export type ReceiptDetails = {
  /** "Payment successful", "Return paid"… */
  headline: string;
  /** Which package, up top under the headline: "Invested in InvestWise Capital (IC)". */
  packageLine: string | null;
  /** What moved, in GH₵ (the amount plus any fee for a payment). */
  total: number;
  /** "5 Oct 2026, at 3:45 PM". */
  when: string;
  sections: ReceiptSection[];
};

const HEADLINES: Record<Transaction["type"], string> = {
  investment: "Payment successful",
  return: "Return paid",
  withdrawal: "Withdrawal paid",
  referral: "Reward received",
};

/** "5 Oct 2026, at 3:45 PM": the full date, as on a bank receipt. */
export function receiptDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" });
  return `${day}, at ${time}`;
}

/**
 * The receipt for a completed transaction. `payment`: the Mobile Money
 * payment that made it, if any (for the wallet and fee); `transactions`:
 * all of theirs, to tell a first investment from a top-up.
 */
export function receiptDetails(
  transaction: Transaction,
  payment: MomoPayment | null,
  transactions: Transaction[],
  withdrawal: WithdrawalRequest | null = null,
): ReceiptDetails {
  if (transaction.type === "withdrawal" && withdrawal) return withdrawalReceipt(transaction, withdrawal);
  const pkg = transaction.packageId ? INVESTMENT_PACKAGES[transaction.packageId] : null;
  const fee = payment?.fee ?? 0;
  const total = transaction.amount + fee;
  const reference: ReceiptRow = { label: "Transaction ID", value: transaction.id, isReference: true };
  const wallet = payment
    ? `${MOMO_NETWORKS[payment.network].name} · ${formatLocalNumber(payment.phone)}`
    : (transaction.channel ?? null);

  if (transaction.type === "investment") {
    // The oldest investment in this package was the first; any later one is a top-up.
    const first = transactions
      .filter((item) => item.type === "investment" && item.packageId === transaction.packageId && item.status !== "failed")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    return {
      headline: HEADLINES.investment,
      packageLine: pkg ? `Invested in ${pkg.name} (${pkg.ticker})` : null,
      total,
      when: receiptDate(transaction.createdAt),
      sections: [
        {
          title: "Investment details",
          rows: [
            ...(pkg ? [{ label: "Portfolio", value: `${pkg.name} (${pkg.ticker})` }] : []),
            { label: "Type", value: first?.id === transaction.id ? "First investment" : "Top-up" },
            ...(pkg ? [{ label: "Expected return", value: `${roiRangeLabel(pkg.monthlyRoiPercent)} a month` }] : []),
          ],
        },
        {
          title: "Payment details",
          rows: [
            reference,
            ...(wallet ? [{ label: "Paid from", value: wallet }] : []),
            { label: "Fee", value: fee === 0 ? "No fee" : formatCedis(fee, { exact: true }) },
            { label: "Total paid", value: formatCedis(total, { exact: true }), isTotal: true },
          ],
        },
      ],
    };
  }

  // Returns, withdrawals and rewards: what it was, then the reference and amount.
  const isMoneyOut = transaction.type === "withdrawal";
  return {
    headline: HEADLINES[transaction.type],
    packageLine: pkg ? `${isMoneyOut ? "From" : "Paid by"} ${pkg.name} (${pkg.ticker})` : null,
    total,
    when: receiptDate(transaction.createdAt),
    sections: [
      {
        title: "Details",
        rows: [
          ...(pkg ? [{ label: "Portfolio", value: `${pkg.name} (${pkg.ticker})` }] : []),
          ...(wallet ? [{ label: isMoneyOut ? "Paid to" : "From", value: wallet }] : []),
        ],
      },
      {
        title: "Transaction",
        rows: [reference, { label: "Amount", value: formatCedis(total, { exact: true }), isTotal: true }],
      },
    ].filter((section) => section.rows.length > 0),
  };
}

/**
 * A paid withdrawal's receipt, from its request: the big figure is what
 * reached their Mobile Money; the rows show the kind, the fee (express: 1%,
 * on top) and the total taken from the wallet (the transaction's amount).
 *
 *            GH₵ 500.00
 *          Withdrawal paid
 *   From InvestWise Capital (IC)
 *   Withdrawal details: Type · Package · Paid to · Requested · Paid
 *   Payment details:    Transaction ID · Reference · Received · Fee · Total taken
 */
function withdrawalReceipt(transaction: Transaction, withdrawal: WithdrawalRequest): ReceiptDetails {
  const pkg = INVESTMENT_PACKAGES[withdrawal.packageId];
  return {
    headline: HEADLINES.withdrawal,
    packageLine: `From ${pkg.name} (${pkg.ticker})`,
    total: withdrawal.amount,
    when: receiptDate(withdrawal.paidAt ?? transaction.createdAt),
    sections: [
      {
        title: "Withdrawal details",
        rows: [
          { label: "Type", value: WITHDRAWAL_KIND_LABELS[withdrawal.kind] },
          { label: "Portfolio", value: `${pkg.name} (${pkg.ticker})` },
          { label: "Paid to", value: `${MOMO_NETWORKS[withdrawal.network].name} · ${formatLocalNumber(withdrawal.phone)}` },
          { label: "Requested", value: receiptDate(withdrawal.createdAt) },
          ...(withdrawal.paidAt ? [{ label: "Paid", value: receiptDate(withdrawal.paidAt) }] : []),
        ],
      },
      {
        title: "Payment details",
        rows: [
          { label: "Transaction ID", value: transaction.id, isReference: true },
          { label: "Withdrawal reference", value: withdrawal.id },
          { label: "Amount received", value: formatCedis(withdrawal.amount, { exact: true }) },
          {
            label: withdrawal.fee > 0 ? "Express fee (1%)" : "Fee",
            value: withdrawal.fee > 0 ? formatCedis(withdrawal.fee, { exact: true }) : "No fee",
          },
          { label: "Total taken from wallet", value: formatCedis(withdrawal.debit, { exact: true }), isTotal: true },
        ],
      },
    ],
  };
}

/** The receipt as plain text (for sharing where an image can't be). */
export function receiptText(details: ReceiptDetails): string {
  const lines = [
    `Feenicks1 receipt: ${details.headline}`,
    formatCedis(details.total, { exact: true }),
    ...(details.packageLine ? [details.packageLine] : []),
    details.when,
    "",
  ];
  for (const section of details.sections) {
    lines.push(section.title);
    for (const row of section.rows) lines.push(`${row.label}: ${row.value}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}
