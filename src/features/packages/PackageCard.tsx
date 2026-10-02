/**
 * PackageCard: one investment package in a list, tappable to its details.
 *
 *   ┌──────────────────────────────────────────┐
 *   │ (💼) Mutual Fund Capital               › │
 *   │      MFC  [Best match]                    │
 *   │ An entry-level investment portfolio…      │
 *   │ ───────────────────────────────────────── │
 *   │ From         Monthly ROI     Withdrawals  │
 *   │ GH₵ 140      5–10%           Monthly      │
 *   └──────────────────────────────────────────┘
 *
 * Also exports PackageIcon (the coloured round icon), reused on the
 * details page.
 */

import Link from "next/link";
import {
  BriefcaseIcon,
  ChevronDownIcon,
  SproutIcon,
  BuildingIcon,
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

/** Icon + soft background colour per package accent. */
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
export function PackageIcon({
  pkg,
  className,
}: {
  pkg: InvestmentPackage;
  className?: string;
}) {
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

export function PackageCard({
  pkg,
  isBestMatch,
}: {
  pkg: InvestmentPackage;
  /** Shows a "Best match" badge (the top recommendation for the user's profile). */
  isBestMatch?: boolean;
}) {
  const stats = [
    { label: "From", value: formatCedis(pkg.minimum) },
    { label: "Monthly ROI", value: roiRangeLabel(pkg.monthlyRoiPercent) },
    { label: "Withdrawals", value: shortWithdrawalLabel(pkg.withdrawalEveryMonths) },
  ];

  return (
    <Link
      href={packageDetailsHref(pkg.id)}
      className={cn(
        "block rounded-2xl border p-4 transition-colors hover:border-neutral-300 focus-visible:border-brand-400 focus-visible:outline-none dark:hover:border-white/20",
        isBestMatch ? "border-brand-600 dark:border-brand-500" : "border-neutral-200 dark:border-white/10",
      )}
    >
      <div className="flex items-center gap-3">
        <PackageIcon pkg={pkg} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] leading-snug font-bold lg:text-sm">{pkg.name}</h3>
          {/* Ticker, with the "Best match" badge beside it (keeps the name unsqueezed). */}
          <p className="mt-0.5 flex items-center gap-2 text-xs font-medium text-neutral-500">
            {pkg.ticker}
            {isBestMatch && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.6875rem] font-semibold text-white">
                Best match
              </span>
            )}
          </p>
        </div>
        {/* "Open" arrow: the chevron icon turned to point right. */}
        <ChevronDownIcon className="size-4 shrink-0 -rotate-90 text-neutral-400" />
      </div>

      <p className="mt-3 text-[0.8125rem] leading-relaxed text-neutral-600 dark:text-neutral-400">
        {pkg.description}
      </p>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3 dark:border-white/10">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="text-[0.6875rem] text-neutral-500">{stat.label}</dt>
            <dd className="mt-0.5 truncate text-[0.8125rem] font-semibold">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </Link>
  );
}
