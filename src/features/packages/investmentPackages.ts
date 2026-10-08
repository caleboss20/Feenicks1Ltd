import type { RiskLevel } from "@/features/investor-profile/riskProfileQuestions";

/**
 * Feenicks1's investment packages: the single source of truth for every
 * package screen (recommendations, details, returns estimate).
 *
 * To change a package, change it here only: every screen, limit, check and
 * explanation reads these values (nothing is copied elsewhere).
 *
 * SOURCE AND AUDIT
 *   Figures: the CEO's portfolio definitions, October 2026. They replace the
 *   September 2025 Telegram list (IC used to stop at GH₵ 2,999.99, ABC was
 *   GH₵ 3,000 – 4,999.99 and REPF started at GH₵ 5,000).
 *
 *     Package                Code  Range (GH₵)             Cycle     Gross ROI    Fee
 *     Mutual Fund Capital    MFC       140.00 –     499.99  28 days   5–10% / mo   2
 *     InvestWise Capital     IC        500.00 –   4,999.99  28 days   5–10% / mo   4
 *     Agribusiness Capital   ABC     5,000.00 –   9,999.99  3 months  7–10% / mo   4
 *     Real Estate Pool Fund  REPF   10,000.00 – 100,000.00  6 months  8–12% / mo   4
 *
 *   Net ROI (the CEO's formula): the month's gross ROI MINUS the fee, in
 *   percentage points, e.g. 7% − 4 = 3%.
 *   Applied everywhere by managementFee (estimate, demo sample, receipts),
 *   never more than the period's profit (Core Business & Product
 *   Architecture v1.1, decision D2: fee = min(fee, gross profit)).
 *
 *   A range change never re-classifies an existing investment (Core
 *   Business & Product Architecture v1.1, §6): someone who invested under an
 *   old range keeps their package.
 *
 * Which risk level each package suits comes from the "Investor Risk
 * Tolerance & Portfolio Match" document.
 *
 * TODO(api): load these from the server so the business can update rates
 * without a new app release.
 */

export type PackageId = "mfc" | "investwise" | "abc" | "repf";

export type InvestmentPackage = {
  id: PackageId;
  name: string;
  ticker: string;
  description: string;
  /** Smallest and largest amount that can be invested, in GH₵. */
  minimum: number;
  maximum: number;
  /**
   * Management fee, in percentage points taken off the month's gross return
   * (CEO's net ROI formula: gross ROI − fee, e.g. 7% − 4 = 3%). See managementFee.
   */
  managementFeePercent: number;
  /** Expected monthly return on investment, in percent: [lowest, highest]. */
  monthlyRoiPercent: [number, number];
  /** Roughly how many months between payouts (for monthly figures like the sample year). */
  withdrawalEveryMonths: number;
  /**
   * The investment cycle, exactly (CEO, October 2026): 28 days for MFC and IC;
   * 3 and 6 calendar months for ABC and REPF. Standard (free) withdrawals come
   * at the end of a cycle (features/withdraw).
   */
  cycle: { days: number } | { months: number };
  /** Icon shown on cards and the details page (see PackageIcon). */
  icon: "briefcase" | "chart" | "sprout" | "building";
  /** Accent colour, matching the company's package graphics. */
  accent: "teal" | "green" | "lime" | "amber";
};

export const INVESTMENT_PACKAGES: Record<PackageId, InvestmentPackage> = {
  mfc: {
    id: "mfc",
    name: "Mutual Fund Capital",
    ticker: "MFC",
    description:
      "An entry-level investment portfolio offering accessibility, flexibility and steady growth.",
    minimum: 140,
    maximum: 499.99,
    managementFeePercent: 2,
    monthlyRoiPercent: [5, 10],
    withdrawalEveryMonths: 1,
    cycle: { days: 28 },
    icon: "briefcase",
    accent: "teal",
  },
  investwise: {
    id: "investwise",
    name: "InvestWise Capital",
    ticker: "IC",
    description:
      "A portfolio for investors seeking higher capital exposure and enhanced returns.",
    minimum: 500,
    maximum: 4999.99,
    managementFeePercent: 4,
    monthlyRoiPercent: [5, 10],
    withdrawalEveryMonths: 1,
    cycle: { days: 28 },
    icon: "chart",
    accent: "green",
  },
  abc: {
    id: "abc",
    name: "Agribusiness Capital",
    ticker: "ABC",
    description:
      "Agriculture-backed investment opportunities focused on sustainability and profitability.",
    minimum: 5000,
    maximum: 9999.99,
    managementFeePercent: 4,
    monthlyRoiPercent: [7, 10],
    withdrawalEveryMonths: 3,
    cycle: { months: 3 },
    icon: "sprout",
    accent: "lime",
  },
  repf: {
    id: "repf",
    name: "Real Estate Pool Fund",
    ticker: "REPF",
    description:
      "A premium real estate investment portfolio targeting long-term capital appreciation.",
    minimum: 10000,
    maximum: 100000,
    managementFeePercent: 4,
    monthlyRoiPercent: [8, 12],
    withdrawalEveryMonths: 6,
    cycle: { months: 6 },
    icon: "building",
    accent: "amber",
  },
};

/** All packages, in the company's order. */
export const ALL_PACKAGES: InvestmentPackage[] = [
  INVESTMENT_PACKAGES.mfc,
  INVESTMENT_PACKAGES.investwise,
  INVESTMENT_PACKAGES.abc,
  INVESTMENT_PACKAGES.repf,
];

/**
 * Packages matched to each risk level (from the Portfolio Match document),
 * best match first.
 */
export const PACKAGES_FOR_RISK_LEVEL: Record<RiskLevel, PackageId[]> = {
  conservative: ["investwise", "mfc"],
  moderate: ["abc", "mfc"],
  aggressive: ["repf"],
};

/** The risk levels a package suits (for the details page). */
export function riskLevelsForPackage(id: PackageId): RiskLevel[] {
  return (Object.keys(PACKAGES_FOR_RISK_LEVEL) as RiskLevel[]).filter((level) =>
    PACKAGES_FOR_RISK_LEVEL[level].includes(id),
  );
}

/** "Every month" / "Every 3 months". */
export function withdrawalLabel(pkg: Pick<InvestmentPackage, "cycle">): string {
  return "days" in pkg.cycle ? `Every ${pkg.cycle.days} days` : `Every ${pkg.cycle.months} months`;
}

/** Compact version for small spaces (cards): "Every 28 days" / "Every 3 mo". */
export function shortWithdrawalLabel(pkg: Pick<InvestmentPackage, "cycle">): string {
  return "days" in pkg.cycle ? `Every ${pkg.cycle.days} days` : `Every ${pkg.cycle.months} mo`;
}

/** When cycle number `count` (1, 2…) ends, counted from `start`. */
export function cycleEnd(pkg: Pick<InvestmentPackage, "cycle">, start: Date, count: number): Date {
  const end = new Date(start);
  if ("days" in pkg.cycle) end.setDate(end.getDate() + pkg.cycle.days * count);
  else end.setMonth(end.getMonth() + pkg.cycle.months * count);
  return end;
}

/** "5–10%". */
export function roiRangeLabel([low, high]: [number, number]): string {
  return `${low}–${high}%`;
}

/**
 * The management fee on `amount` over `months`, in GH₵, by the CEO's
 * formula: net ROI = gross ROI − fee, so the fee is the fee's percentage
 * points of the amount, per month (GH₵ 1,000, 4 points, 1 month = GH₵ 40).
 * Never more than the gross profit (no fee eats into the amount invested),
 * and nothing when there's no profit.
 *
 *   GH₵ 1,000 at 7% gross, fee 4:  gross 70, fee 40, paid 30  (net 3%)
 *   GH₵ 1,000 at 3% gross, fee 4:  gross 30, fee 30, paid 0   (capped)
 */
export function managementFee(amount: number, feePoints: number, months: number, grossProfit: number): number {
  if (grossProfit <= 0) return 0;
  return Math.min((amount * feePoints * months) / 100, grossProfit);
}

/**
 * Estimated profit for an amount over a number of months, as a [low, high]
 * range from the expected monthly ROI, before and after the management fee
 * (managementFee: gross ROI − fee), so "after fee" is what the investor
 * would receive.
 */
export function estimateProfit(pkg: InvestmentPackage, amount: number, months: number) {
  const [lowRoi, highRoi] = pkg.monthlyRoiPercent;
  const beforeFee: [number, number] = [
    (amount * lowRoi * months) / 100,
    (amount * highRoi * months) / 100,
  ];
  const fee: [number, number] = [
    managementFee(amount, pkg.managementFeePercent, months, beforeFee[0]),
    managementFee(amount, pkg.managementFeePercent, months, beforeFee[1]),
  ];
  const afterFee: [number, number] = [beforeFee[0] - fee[0], beforeFee[1] - fee[1]];
  const afterFeePerMonth: [number, number] = [afterFee[0] / months, afterFee[1] / months];
  return { beforeFee, fee, afterFee, afterFeePerMonth };
}

export function isPackageId(value: string): value is PackageId {
  return value in INVESTMENT_PACKAGES;
}
