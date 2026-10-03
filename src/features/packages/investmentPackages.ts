import type { RiskLevel } from "@/features/investor-profile/riskProfileQuestions";

/**
 * Feenicks1's investment packages: the single source of truth for every
 * package screen (recommendations, details, returns estimate).
 *
 * Figures come from the company's package sheet; which risk level each
 * package suits comes from the "Investor Risk Tolerance & Portfolio Match"
 * document. To change a package, change it here only.
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
  /** Management fee, in percent. */
  managementFeePercent: number;
  /** Expected monthly return on investment, in percent: [lowest, highest]. */
  monthlyRoiPercent: [number, number];
  /** Returns can be withdrawn every N months. */
  withdrawalEveryMonths: number;
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
    maximum: 2999.99,
    managementFeePercent: 4,
    monthlyRoiPercent: [5, 10],
    withdrawalEveryMonths: 1,
    icon: "chart",
    accent: "green",
  },
  abc: {
    id: "abc",
    name: "Agribusiness Capital",
    ticker: "ABC",
    description:
      "Agriculture-backed investment opportunities focused on sustainability and profitability.",
    minimum: 3000,
    maximum: 4999.99,
    managementFeePercent: 4,
    monthlyRoiPercent: [7, 10],
    withdrawalEveryMonths: 3,
    icon: "sprout",
    accent: "lime",
  },
  repf: {
    id: "repf",
    name: "Real Estate Pool Fund",
    ticker: "REPF",
    description:
      "A premium real estate investment portfolio targeting long-term capital appreciation.",
    minimum: 5000,
    maximum: 100000,
    managementFeePercent: 4,
    monthlyRoiPercent: [8, 12],
    withdrawalEveryMonths: 6,
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
export function withdrawalLabel(everyMonths: number): string {
  return everyMonths === 1 ? "Every month" : `Every ${everyMonths} months`;
}

/** Compact version for small spaces (cards): "Monthly" / "Every 3 mo". */
export function shortWithdrawalLabel(everyMonths: number): string {
  return everyMonths === 1 ? "Monthly" : `Every ${everyMonths} mo`;
}

/** "5–10%". */
export function roiRangeLabel([low, high]: [number, number]): string {
  return `${low}–${high}%`;
}

/**
 * Estimated profit for an amount over a number of months, as a [low, high]
 * range from the expected monthly ROI. The management fee is a percentage
 * of the PROFIT (not of the amount invested), so "after fee" is what the
 * investor actually receives.
 */
export function estimateProfit(pkg: InvestmentPackage, amount: number, months: number) {
  const [lowRoi, highRoi] = pkg.monthlyRoiPercent;
  const beforeFee: [number, number] = [
    (amount * lowRoi * months) / 100,
    (amount * highRoi * months) / 100,
  ];
  const fee: [number, number] = [
    (beforeFee[0] * pkg.managementFeePercent) / 100,
    (beforeFee[1] * pkg.managementFeePercent) / 100,
  ];
  const afterFee: [number, number] = [beforeFee[0] - fee[0], beforeFee[1] - fee[1]];
  const afterFeePerMonth: [number, number] = [afterFee[0] / months, afterFee[1] / months];
  return { beforeFee, fee, afterFee, afterFeePerMonth };
}

export function isPackageId(value: string): value is PackageId {
  return value in INVESTMENT_PACKAGES;
}
