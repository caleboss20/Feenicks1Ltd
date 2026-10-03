"use client";

/**
 * Analytics tab: how the user's money is doing.
 *
 *   Analytics
 *   [ Portfolio value ] [ Profit earned ]    ← summary tiles
 *   [ Active investments ]
 *   ┌ 📊 No data yet ─────────────────────┐
 *   │ Invest to see your growth here.      │
 *   │ ( Explore packages )                  │
 *   └───────────────────────────────────────┘
 *
 * Honest by design: zeros and an empty state until investing exists.
 * TODO(invest): growth chart, profit per package, monthly returns.
 */

import Link from "next/link";
import { ChartBarIcon } from "@/components/icons";
import { AppTabScreenLayout } from "@/components/layout/AppTabScreenLayout";
import { ROUTES } from "@/config/routes";
import { formatCedis } from "@/lib/money";

/** TODO(invest): real figures from the server. */
const SUMMARY = [
  { label: "Portfolio value", value: formatCedis(0, { exact: true }) },
  { label: "Profit earned", value: formatCedis(0, { exact: true }) },
  { label: "Active investments", value: "0" },
  { label: "Withdrawn", value: formatCedis(0, { exact: true }) },
];

export function AnalyticsScreen() {
  return (
    <AppTabScreenLayout title="Analytics" subtitle="How your investments are doing.">
      <dl className="grid grid-cols-2 gap-3">
        {SUMMARY.map((item) => (
          <div key={item.label} className="rounded-3xl bg-neutral-50 p-4 dark:bg-white/5">
            <dt className="text-xs text-neutral-500">{item.label}</dt>
            <dd className="mt-1.5 text-lg font-semibold tracking-tight">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col items-center rounded-3xl border border-neutral-100 px-6 py-10 text-center dark:border-white/10">
        <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
          <ChartBarIcon className="size-6" />
        </span>
        <h2 className="mt-4 text-base font-semibold">No data yet</h2>
        <p className="mt-1.5 max-w-60 text-[0.8125rem] leading-relaxed text-neutral-500">
          Once you invest, your growth and profit will show here.
        </p>
        <Link
          href={ROUTES.invest}
          className="mt-5 inline-flex h-10 items-center rounded-full bg-brand-600 px-5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Explore packages
        </Link>
      </section>
    </AppTabScreenLayout>
  );
}
