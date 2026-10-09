import { valueEffect } from "@/features/analytics/portfolioHistory";
import { INVESTMENT_PACKAGES } from "@/features/packages/investmentPackages";
import type { Transaction } from "@/features/transactions/transactionModel";
import type { WithdrawalRequest } from "@/features/withdraw/withdrawalModel";

/**
 * Account statements: everything on a statement, worked out from the
 * investor's real transactions (never sample or made-up figures). The PDF
 * (statementPdf.ts), the Excel file (statementExcel.ts) and the in-app
 * preview all read this one object, so they can never disagree.
 *
 *   opening balance    the portfolio value at the start of the period
 *   + deposits         money invested in the period
 *   + returns          profit paid in the period (after the management fee)
 *   + rewards          referral rewards in the period
 *   − withdrawals      money taken out, including any express fee
 *   = closing balance  the portfolio value at the end of the period
 *
 * Only completed transactions count (as on the dashboard). Pending ones are
 * mentioned, not added. Amounts are rounded to the pesewa at every step.
 * TODO(api): GET /api/statements?from&to returns these figures, so the server
 * (the system of record) issues every statement.
 */

export type StatementPeriodId = "this-month" | "last-3-months" | "last-6-months" | "this-year" | "all" | "custom";

export const STATEMENT_PERIODS: { id: StatementPeriodId; label: string }[] = [
  { id: "this-month", label: "This month" },
  { id: "last-3-months", label: "Last 3 months" },
  { id: "last-6-months", label: "Last 6 months" },
  { id: "this-year", label: "This year" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

export type StatementPeriod = { from: Date; to: Date };

export type StatementLine = {
  date: Date;
  reference: string;
  /** "Deposit", "Return", "Withdrawal", "Reward". */
  kind: string;
  description: string;
  moneyIn: number;
  moneyOut: number;
  /** The balance after this line. */
  balance: number;
};

export type StatementReturn = {
  date: Date;
  reference: string;
  portfolio: string;
  /** From the return's breakdown, when the server recorded one. */
  principal: number | null;
  ratePercent: number | null;
  months: number | null;
  gross: number | null;
  fee: number | null;
  net: number;
};

export type StatementMonth = { label: string; moneyIn: number; returns: number; moneyOut: number; closing: number };

export type Statement = {
  period: StatementPeriod;
  openingBalance: number;
  closingBalance: number;
  totals: {
    deposits: number;
    returns: number;
    rewards: number;
    withdrawals: number;
    /** Express withdrawal fees (already inside `withdrawals`). */
    expressFees: number;
    /** Management fees taken before returns were paid (already outside `returns`). */
    managementFees: number;
  };
  /** Returns as a % of the money that could earn: opening balance + deposits. Null when nothing was invested. */
  returnPercent: number | null;
  lines: StatementLine[];
  returns: StatementReturn[];
  months: StatementMonth[];
  /** The value over the period, for the chart: the opening point, each change, the closing point. */
  series: { time: number; value: number }[];
  /** Transactions in the period still pending (not on the statement yet). */
  pendingCount: number;
  portfolios: string[];
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

/** The dates a period covers, up to `now`. */
export function periodFor(
  id: StatementPeriodId,
  transactions: Transaction[],
  custom: { from: string; to: string } | null,
  now = new Date(),
): StatementPeriod {
  const monthsBack = (months: number) => startOfDay(new Date(now.getFullYear(), now.getMonth() - months, now.getDate()));
  switch (id) {
    case "this-month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "last-3-months":
      return { from: monthsBack(3), to: now };
    case "last-6-months":
      return { from: monthsBack(6), to: now };
    case "this-year":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case "all": {
      const first = transactions.reduce((earliest, item) => Math.min(earliest, Date.parse(item.createdAt)), now.getTime());
      return { from: startOfDay(new Date(first)), to: now };
    }
    case "custom": {
      const from = custom?.from ? startOfDay(new Date(`${custom.from}T00:00`)) : startOfDay(now);
      const to = custom?.to ? endOfDay(new Date(`${custom.to}T00:00`)) : now;
      return { from, to: to > now ? now : to };
    }
  }
}

/** True when a custom period's dates are complete and in order. */
export function isValidPeriod(period: StatementPeriod): boolean {
  return !Number.isNaN(period.from.getTime()) && !Number.isNaN(period.to.getTime()) && period.from <= period.to;
}

const KIND: Record<Transaction["type"], string> = {
  investment: "Deposit",
  return: "Return",
  withdrawal: "Withdrawal",
  referral: "Reward",
};

function describe(transaction: Transaction, withdrawal: WithdrawalRequest | undefined): string {
  const pkg = transaction.packageId ? INVESTMENT_PACKAGES[transaction.packageId] : null;
  switch (transaction.type) {
    case "investment":
      return `Into ${pkg?.name ?? "your portfolio"}${transaction.channel ? ` from ${transaction.channel}` : ""}`;
    case "return":
      return `Return from ${pkg?.name ?? "your portfolio"}`;
    case "withdrawal":
      return withdrawal && withdrawal.fee > 0
        ? `To ${transaction.channel ?? "Mobile Money"} (incl. GHS ${withdrawal.fee.toFixed(2)} express fee)`
        : `To ${transaction.channel ?? "Mobile Money"}`;
    case "referral":
      return "Referral reward";
  }
}

/** The statement for `period`. */
export function buildStatement(
  transactions: Transaction[],
  withdrawals: WithdrawalRequest[],
  period: StatementPeriod,
): Statement {
  const from = period.from.getTime();
  const to = period.to.getTime();
  const sorted = [...transactions].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const requestFor = new Map(withdrawals.map((item) => [item.transactionId, item]));

  let balance = 0;
  for (const item of sorted) if (Date.parse(item.createdAt) < from) balance = round2(balance + valueEffect(item));
  const openingBalance = balance;

  const totals = { deposits: 0, returns: 0, rewards: 0, withdrawals: 0, expressFees: 0, managementFees: 0 };
  const lines: StatementLine[] = [];
  const returns: StatementReturn[] = [];
  const series = [{ time: from, value: openingBalance }];
  const portfolios = new Set<string>();
  let pendingCount = 0;

  for (const item of sorted) {
    const time = Date.parse(item.createdAt);
    if (time < from || time > to) continue;
    if (item.status === "pending") pendingCount += 1;
    if (item.status !== "completed") continue;

    const pkg = item.packageId ? INVESTMENT_PACKAGES[item.packageId] : null;
    if (pkg) portfolios.add(pkg.name);
    const effect = valueEffect(item);
    balance = round2(balance + effect);
    const request = item.type === "withdrawal" ? requestFor.get(item.id) : undefined;

    if (item.type === "investment") totals.deposits += item.amount;
    if (item.type === "return") {
      totals.returns += item.amount;
      totals.managementFees += item.breakdown?.fee ?? 0;
      returns.push({
        date: new Date(time),
        reference: item.id,
        portfolio: pkg?.name ?? "Portfolio",
        principal: item.breakdown?.principal ?? null,
        ratePercent: item.breakdown?.monthlyRatePercent ?? null,
        months: item.breakdown?.months ?? null,
        gross: item.breakdown?.grossProfit ?? null,
        fee: item.breakdown?.fee ?? null,
        net: item.amount,
      });
    }
    if (item.type === "referral") totals.rewards += item.amount;
    if (item.type === "withdrawal") {
      totals.withdrawals += item.amount;
      totals.expressFees += request?.fee ?? 0;
    }

    lines.push({
      date: new Date(time),
      reference: item.id,
      kind: KIND[item.type],
      description: describe(item, request),
      moneyIn: effect > 0 ? item.amount : 0,
      moneyOut: effect < 0 ? item.amount : 0,
      balance,
    });
    series.push({ time, value: balance });
  }
  series.push({ time: to, value: balance });

  for (const key of Object.keys(totals) as (keyof typeof totals)[]) totals[key] = round2(totals[key]);
  const base = openingBalance + totals.deposits;

  return {
    period,
    openingBalance,
    closingBalance: balance,
    totals,
    returnPercent: base > 0 ? round2((totals.returns / base) * 100) : null,
    lines,
    returns,
    months: monthlyTotals(lines, openingBalance, period),
    series,
    pendingCount,
    portfolios: [...portfolios],
  };
}

/** Money in, returns, money out and the closing balance for each calendar month in the period. */
function monthlyTotals(lines: StatementLine[], opening: number, period: StatementPeriod): StatementMonth[] {
  const months: StatementMonth[] = [];
  let closing = opening;
  const cursor = new Date(period.from.getFullYear(), period.from.getMonth(), 1);
  while (cursor <= period.to) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const inMonth = lines.filter((line) => line.date >= cursor && line.date < next);
    const moneyIn = round2(inMonth.filter((line) => line.kind !== "Return").reduce((sum, line) => sum + line.moneyIn, 0));
    const returns = round2(inMonth.filter((line) => line.kind === "Return").reduce((sum, line) => sum + line.moneyIn, 0));
    const moneyOut = round2(inMonth.reduce((sum, line) => sum + line.moneyOut, 0));
    closing = inMonth.length > 0 ? inMonth[inMonth.length - 1].balance : closing;
    months.push({
      label: cursor.toLocaleDateString("en-GH", { month: "short", year: "numeric" }),
      moneyIn,
      returns,
      moneyOut,
      closing,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

/** "1 Jul 2026 – 8 Oct 2026". */
export function periodLabel(period: StatementPeriod): string {
  const date = (value: Date) => value.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
  return `${date(period.from)} – ${date(period.to)}`;
}

/** "GHS 2,000.00": statements spell the currency out (PDF fonts have no ₵ sign). */
export function ghs(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}GHS ${Math.abs(amount).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
