"use client";

/**
 * Dashboard colour (Account › Dashboard colour): the colour behind the
 * balance on Home. A live preview at the top, then every colour as a round
 * swatch. Tapping one applies it straight away (no Save button) and it's
 * remembered on this device (useThemeStore), like dark mode.
 *
 *   (←)          Dashboard colour
 *   ╭────────────────────────────────────╮
 *   │ Portfolio value                     │   ← live preview: the top of Home
 *   │ GH₵ 3,289.60                        │     in the chosen colour
 *   │ [ + Invest ]   [ ↓ Withdraw ]       │
 *   ╰────────────────────────────────────╯
 *   ╭ Choose a colour ───────────────────╮
 *   │  (✓)    ( )     ( )     ( )         │   ← 17 colours (dashboardTheme.ts),
 *   │ Green  Emerald  Teal   Ocean        │     4 a row; the chosen one ringed,
 *   │  …                                   │     with a tick
 *   ╰────────────────────────────────────╯
 *
 * The swatches are real radio buttons (hidden, with round faces), so they
 * work with screen readers and arrow keys.
 */

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckIcon, PlusIcon } from "@/components/icons";
import { GREY_PAGE_COLORS } from "@/config/pageColors";
import { ROUTES } from "@/config/routes";
import { currentValue } from "@/features/analytics/portfolioHistory";
import {
  DASHBOARD_COLORS,
  dashboardColor,
  DEFAULT_DASHBOARD_COLOR,
  swatchGradient,
} from "@/features/dashboard/dashboardTheme";
import { useTransactions } from "@/features/transactions/useTransactions";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { CEDI_SYMBOL, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/useThemeStore";

export function DashboardColorScreen() {
  useStatusBarColor(GREY_PAGE_COLORS);
  const selected = dashboardColor(useThemeStore((state) => state.dashboardColor));
  const setDashboardColor = useThemeStore((state) => state.setDashboardColor);

  // The preview shows their real balance (GH₵ 0.00 until they invest).
  const transactions = useTransactions();
  const [whole, fraction] = formatCedisNumber(transactions ? currentValue(transactions) : 0, {
    exact: true,
  }).split(".");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 bg-neutral-100 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10 dark:bg-background">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <Link
          href={ROUTES.account}
          aria-label="Back to account"
          className="grid size-11 place-items-center rounded-full bg-black/5 transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-center text-[1.0625rem] font-semibold">Dashboard colour</h1>
      </header>

      {/* Live preview: the top of Home, in the chosen colour (decorative). */}
      <div
        aria-hidden
        className="rounded-3xl px-5 pt-5 pb-5 text-white"
        style={{ backgroundImage: `linear-gradient(to bottom, ${selected.top}, ${selected.main})` }}
      >
        <p className="text-sm font-medium text-white/85">Portfolio value</p>
        <p className="mt-2.5 flex items-baseline gap-1.5 leading-none font-bold">
          <span className="text-lg text-white/90">{CEDI_SYMBOL}</span>
          <span className="text-[2.125rem] tracking-[-0.03em] tabular-nums">
            {whole}
            <span className="text-[1.375rem] text-white/80">.{fraction}</span>
          </span>
        </p>
        <div className="mt-6 flex gap-2.5">
          <span className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-semibold text-neutral-900">
            <PlusIcon className="size-4" />
            Invest
          </span>
          <span className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-semibold text-neutral-900">
            <ArrowRight className="size-4 rotate-90" />
            Withdraw
          </span>
        </div>
      </div>

      <fieldset className="rounded-3xl bg-white p-5 dark:bg-white/5">
        <legend className="sr-only">Dashboard colour</legend>
        <p aria-hidden className="text-sm font-semibold">
          Choose a colour
        </p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          It sits behind your balance on Home. Green is the default.
        </p>

        <div className="mt-5 grid grid-cols-4 gap-x-2 gap-y-5">
          {DASHBOARD_COLORS.map((color) => {
            const isSelected = color.id === selected.id;
            return (
              <label key={color.id} className="group flex cursor-pointer flex-col items-center gap-2">
                <input
                  type="radio"
                  name="dashboard-color"
                  value={color.id}
                  checked={isSelected}
                  onChange={() => setDashboardColor(color.id)}
                  aria-label={color.id === DEFAULT_DASHBOARD_COLOR ? `${color.name} (default)` : color.name}
                  className="peer sr-only"
                />
                {/* The swatch: the colour's own top-to-main blend. */}
                <span
                  aria-hidden
                  className={cn(
                    "grid size-12 place-items-center rounded-full text-white transition-transform group-active:scale-95",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 peer-focus-visible:ring-offset-2",
                    isSelected &&
                      "ring-2 ring-neutral-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-neutral-900",
                  )}
                  style={{ backgroundImage: swatchGradient(color) }}
                >
                  {isSelected && <CheckIcon className="size-5" />}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "text-xs",
                    isSelected ? "font-semibold" : "text-neutral-600 dark:text-neutral-400",
                  )}
                >
                  {color.name}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
