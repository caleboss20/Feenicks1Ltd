import {
  PACKAGES_FOR_RISK_LEVEL,
  type InvestmentPackage,
  type PackageId,
} from "@/features/packages/investmentPackages";
import type { RiskLevel } from "./riskProfileQuestions";

/**
 * Who the investor is: the first question of the investor profile, from
 * the CEO's portfolio guide ("Which F1 CAPITAL portfolio fits your goals?",
 * October 2026). Each profile points to the portfolios built for it:
 *
 *   01 STUDENT          Start small. Build the habit.   → Mutual Fund Capital
 *   02 INVESTOR         Scale with structure.           → InvestWise Capital,
 *                                                          Agribusiness Capital
 *   03 BUSINESS OWNER   Put capital to work.            → Real Estate Pool Fund
 *
 * The profile narrows the choice; the risk questions then pick the best
 * match among its portfolios (recommendedPortfolioIds). Every portfolio
 * stays open to everyone: the rest are listed under "Other portfolios".
 * Ranges and cycles always come from investmentPackages.ts (the guide's
 * MFC minimum of GHS 150 is superseded by the CEO's GH₵ 140).
 */

export type InvestorSegment = "student" | "investor" | "business-owner";

export type InvestorSegmentInfo = {
  id: InvestorSegment;
  /** "01", "02", "03": the guide's numbering. */
  number: string;
  name: string;
  tagline: string;
  /** The portfolios built for this profile, in the guide's order. */
  packageIds: PackageId[];
  /**
   * Photo in the tile (600×600, under /public). Unsplash License (free for
   * commercial use, no attribution required); sources:
   *   student         unsplash.com/photos/A5shyTfMMeo (Enoch Appiah Jr., Kumasi, Ghana)
   *   investor        unsplash.com/photos/TdgCYy02i_I
   *   business owner  unsplash.com/photos/uk3ey_vhDKA
   */
  photo: { src: string; alt: string; /** CSS object-position: keeps the face in the narrow tile. */ focus: string };
  /** The tile's colours, after the guide: yellow, navy, red. */
  tone: "yellow" | "navy" | "red";
};

export const INVESTOR_SEGMENTS: InvestorSegmentInfo[] = [
  {
    id: "student",
    number: "01",
    name: "Student",
    tagline: "Start small. Build the habit.",
    packageIds: ["mfc"],
    photo: { src: "/images/profiles/student-graduate.jpg", alt: "A smiling young Ghanaian graduate in her cap and kente stole", focus: "60% 18%" },
    tone: "yellow",
  },
  {
    id: "investor",
    number: "02",
    name: "Investor",
    tagline: "Scale with structure.",
    packageIds: ["investwise", "abc"],
    photo: { src: "/images/profiles/investor.jpg", alt: "An investor in a suit checking his phone", focus: "50% 36%" },
    tone: "navy",
  },
  {
    id: "business-owner",
    number: "03",
    name: "Business owner",
    tagline: "Put capital to work.",
    packageIds: ["repf"],
    photo: { src: "/images/profiles/business-owner.jpg", alt: "A business owner in an apron using his phone at his stall", focus: "50% 26%" },
    tone: "red",
  },
];

export function segmentInfo(id: InvestorSegment): InvestorSegmentInfo {
  return INVESTOR_SEGMENTS.find((segment) => segment.id === id) ?? INVESTOR_SEGMENTS[0];
}

/** One line on what each portfolio is, as worded in the guide. */
export const PORTFOLIO_SUMMARIES: Record<PackageId, string> = {
  mfc: "Entry-level, diversified managed portfolio",
  investwise: "Broader market exposure for growing capital",
  abc: "Participation in licensed agribusiness firms",
  repf: "Pooled real-estate participation, no property management",
};

/** "28-day cycle" / "3-month cycle"; short: "28 days" / "3 months". */
export function cycleLabel(pkg: Pick<InvestmentPackage, "cycle">, short = false): string {
  if ("days" in pkg.cycle) return short ? `${pkg.cycle.days} days` : `${pkg.cycle.days}-day cycle`;
  return short ? `${pkg.cycle.months} months` : `${pkg.cycle.months}-month cycle`;
}

/**
 * The portfolios to recommend, best match first. With a profile: its
 * portfolios, those that also suit the risk level first. Without one
 * (answered before the profile question existed): the risk level's list.
 */
export function recommendedPortfolioIds(level: RiskLevel, segment: InvestorSegment | null): PackageId[] {
  const forRisk = PACKAGES_FOR_RISK_LEVEL[level];
  if (!segment) return forRisk;
  const ids = segmentInfo(segment).packageIds;
  return [...ids.filter((id) => forRisk.includes(id)), ...ids.filter((id) => !forRisk.includes(id))];
}

