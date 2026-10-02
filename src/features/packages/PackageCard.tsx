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
 * Also exports PackageIcon (the coloured round icon) for the details page.
 */

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseIcon,
  BuildingIcon,
  ClockIcon,
  SproutIcon,
  TrendUpIcon,
} from "@/components/icons";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  packageDetailsHref,
  roiRangeLabel,
  shortWithdrawalLabel,
  type InvestmentPackage,
} from "./investmentPackages";

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

export function PackageCard({
  pkg,
  isBestMatch,
}: {
  pkg: InvestmentPackage;
  /** The top recommendation for the user's profile: green outline + label. */
  isBestMatch?: boolean;
}) {
  const [lowRoi, highRoi] = pkg.monthlyRoiPercent;

  return (
    <Link
      href={packageDetailsHref(pkg.id)}
      aria-label={`${pkg.name}${isBestMatch ? ", best match" : ""}. Expected return ${roiRangeLabel(pkg.monthlyRoiPercent)} a month, from ${formatCedis(pkg.minimum)}.`}
      className={cn(
        "group block p-6 transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
        WAVY_CORNERS,
        "bg-neutral-100 text-foreground dark:bg-white/5",
        // Best match: thin green outline (inset, so the card keeps its size).
        isBestMatch && "ring-[1.5px] ring-brand-600 ring-inset dark:ring-brand-500",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            {pkg.ticker}
            {isBestMatch && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.6875rem] font-semibold text-white">
                Best match
              </span>
            )}
          </p>
          <h3 className="mt-1.5 text-[1.375rem] leading-[1.15] font-semibold tracking-tight">
            {pkg.name}
          </h3>
        </div>

        {/* Round arrow (↗), like "open this". */}
        <span
          aria-hidden
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full transition-transform group-hover:rotate-12",
            "bg-brand-600 text-white",
          )}
        >
          <ArrowRight className="size-5 -rotate-45" />
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
        <span>
          <span className="text-neutral-500">From </span>
          <span className="font-semibold">{formatCedis(pkg.minimum)}</span>
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
