/**
 * PackageCard: one investment package in a list, tappable to its details.
 * Sleek, large-type card with soft "wavy" corners (each corner curves a
 * little differently), inspired by a modern plan-picker design.
 *
 *   ╭──────────────────────────────────────╮
 *   │ ABC [Best match]                     │
 *   │ Agribusiness                   ( ↗ ) │   ← big name, round arrow
 *   │ Capital                               │
 *   │                                       │
 *   │ Expected return                       │
 *   │ 7–10% /month                          │   ← the headline number
 *   │ ( From GH₵ 3,000        ⏱ Every 3 mo )   ← pill: minimum + withdrawals
 *   ╰──────────────────────────────────────╯
 *
 * One look for every card (soft light grey, dark text: fintech-restrained).
 * The "Best match" card only differs by a thin green outline and a small
 * green "Best match" label.
 *
 * Under the package rules (packagePolicy.ts: for now, one investor, one
 * package), the investor's own package says "Your package" and shows how much
 * they've put in instead of the minimum, and packages they can't invest in
 * now show a grey lock instead of the green arrow. Locked cards still open, so
 * the details and returns calculator can be read.
 *
 * Also exports PackageIcon (the coloured round icon) for the details page.
 */

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseIcon,
  BuildingIcon,
  ClockIcon,
  LockIcon,
  SproutIcon,
  TrendUpIcon,
} from "@/components/icons";
import { packageDetailsHref, type InvestingFlow } from "@/config/investingFlow";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import { roiRangeLabel, shortWithdrawalLabel, type InvestmentPackage } from "./investmentPackages";

/** Icon + soft background colour per package accent (details page). */
const ACCENTS: Record<InvestmentPackage["accent"], string> = {
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
  green: "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
  lime: "bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};

const ICONS: Record<InvestmentPackage["icon"], React.ReactNode> = {
  briefcase: <BriefcaseIcon />,
  chart: <TrendUpIcon />,
  sprout: <SproutIcon />,
  building: <BuildingIcon />,
};

/** The package's round, coloured icon. */
export function PackageIcon({ pkg, className }: { pkg: InvestmentPackage; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full [&_svg]:size-5",
        ACCENTS[pkg.accent],
        className,
      )}
    >
      {ICONS[pkg.icon]}
    </span>
  );
}

/**
 * Soft, slightly uneven corners (elliptical radii, different per corner):
 * reads as a gentle wave rather than a plain rounded rectangle.
 */
const WAVY_CORNERS = "rounded-[2.25rem_2.75rem_2.25rem_2.75rem/2.75rem_2rem_2.75rem_2rem]";

/** The card's element id, e.g. to scroll the selected package into view. */
export function packageCardId(packageId: string): string {
  return `package-${packageId}`;
}

export function PackageCard({
  pkg,
  flow,
  isBestMatch,
  isSelected,
  onSelect,
  isYours,
  invested,
  isLocked,
}: {
  pkg: InvestmentPackage;
  /** Which details page it opens: in the app (/invest/…) or during onboarding (/packages/…). */
  flow: InvestingFlow;
  /** The top recommendation for the user's profile: green outline + label. */
  isBestMatch?: boolean;
  /** The package the user picked (tapped, or last opened): highlighted. */
  isSelected?: boolean;
  /** Called when the card is tapped, just before its details open. */
  onSelect?: () => void;
  /** The investor's own package: green outline + "Your package" label. */
  isYours?: boolean;
  /** How much they've put in (their package), shown instead of the minimum. */
  invested?: number;
  /** They can't invest in it right now (package rules): a lock instead of the arrow. */
  isLocked?: boolean;
}) {
  const [lowRoi, highRoi] = pkg.monthlyRoiPercent;
  const label = isYours ? "Your package" : isBestMatch ? "Best match" : null;

  return (
    <Link
      id={packageCardId(pkg.id)}
      href={packageDetailsHref(pkg.id, flow)}
      onClick={onSelect}
      aria-label={`${pkg.name}${label ? `, ${label.toLowerCase()}` : ""}${isSelected ? ", selected" : ""}${isLocked ? ", not available to invest in right now" : ""}. Expected return ${roiRangeLabel(pkg.monthlyRoiPercent)} a month, ${invested !== undefined ? `you've invested ${formatCedis(invested)}` : `from ${formatCedis(pkg.minimum)}`}.`}
      className={cn(
        "group block p-6 transition-[transform,background-color,box-shadow] duration-200 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
        WAVY_CORNERS,
        "text-foreground",
        // Selected: light green fill and a firmer green outline. Otherwise grey,
        // with a thin green outline on the best match. (Outlines are inset, so
        // the card keeps its size.)
        isSelected
          ? "bg-brand-50 ring-2 ring-brand-600 ring-inset dark:bg-brand-500/10 dark:ring-brand-500"
          : cn(
              "bg-neutral-100 dark:bg-white/5",
              (isBestMatch || isYours) && "ring-[1.5px] ring-brand-600 ring-inset dark:ring-brand-500",
            ),
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            {pkg.ticker}
            {label && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.6875rem] font-semibold text-white">
                {label}
              </span>
            )}
          </p>
          <h3 className="mt-1.5 text-[1.375rem] leading-[1.15] font-semibold tracking-tight">
            {pkg.name}
          </h3>
        </div>

        {/* Round arrow (↗), like "open this"; a grey lock when it can't be invested in now. */}
        <span
          aria-hidden
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full transition-transform",
            isLocked
              ? "bg-neutral-200 text-neutral-500 dark:bg-white/10 dark:text-neutral-400"
              : "bg-brand-600 text-white group-hover:rotate-12",
          )}
        >
          {isLocked ? <LockIcon className="size-5" /> : <ArrowRight className="size-5 -rotate-45" />}
        </span>
      </div>

      <p className="mt-6 text-xs text-neutral-500">
        Expected return
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[2rem] leading-none font-semibold tracking-tight">
          {lowRoi}–{highRoi}%
        </span>
        <span className="text-sm text-neutral-500">
          /month
        </span>
      </p>

      {/* Key terms in a pill. */}
      <div
        className={cn(
          "mt-5 flex items-center justify-between gap-3 rounded-full px-4 py-2.5 text-[0.8125rem] whitespace-nowrap",
          "bg-background dark:bg-white/5",
        )}
      >
        {/* Their package: what they've put in. Otherwise: the minimum to start. */}
        <span>
          <span className="text-neutral-500">{invested !== undefined ? "Invested " : "From "}</span>
          <span className="font-semibold">{formatCedis(invested ?? pkg.minimum)}</span>
        </span>
        {/* How often profit can be withdrawn: clock + "Monthly" / "Every 3 mo". */}
        <span
          className="flex items-center gap-1.5 text-neutral-500"
        >
          <ClockIcon className="size-3.5" />
          <span className="sr-only">Withdrawals: </span>
          {shortWithdrawalLabel(pkg.withdrawalEveryMonths)}
        </span>
      </div>
    </Link>
  );
}
