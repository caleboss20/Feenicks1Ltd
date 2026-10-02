"use client";

/**
 * Dashboard (Home): layout of the "Vytinqo" fintech reference (coloured
 * balance header, quick access, activity, tab bar with a raised centre
 * button), styled like the clean green/white reference: lots of white
 * space, regular text, round soft-grey icon buttons.
 *
 *   ╭──────────── brand green ─────────────╮
 *   │ (AM) Good morning,           ( ⇥ )  │   ← log out
 *   │      Ama Mensah                       │
 *   │          Portfolio value (👁)         │   ← tap the eye to hide amounts
 *   │            GH₵ 0.00                   │
 *   │        Profit earned GH₵ 0.00         │
 *   │   ( ↗ Invest )  ( ↓ Withdraw )        │
 *   ╰───────────────────────────────────────╯
 *   Quick access
 *   (▦)        (🧮)         (🧭)          (🎧)
 *   Packages  Calculator  Risk profile  Support
 *
 *   Your investments
 *   ┌ You haven't invested yet … best match ┐
 *   Recent activity
 *   No activity yet …
 *
 *   🏠 Home   ▦ Packages   (+)   🧭 Profile   🎧 Support
 *
 * Honest by design: no made-up balances or transactions. Until investing is
 * built (TODO(invest)), amounts are GH₵ 0.00 and the lists show empty states.
 * Access and auto-lock: the (app) layout (AppLockGuard).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalculatorIcon,
  ClockIcon,
  CompassIcon,
  EyeIcon,
  EyeOffIcon,
  GridIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  SupportIcon,
} from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { logOut } from "@/features/auth/authService";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { RISK_LEVELS } from "@/features/investor-profile/riskProfileQuestions";
import {
  INVESTMENT_PACKAGES,
  PACKAGES_FOR_RISK_LEVEL,
  packageDetailsHref,
  roiRangeLabel,
} from "@/features/packages/investmentPackages";
import { PackageIcon } from "@/features/packages/PackageCard";
import { formatCedis } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Company website, for "Support" until in-app support exists. */
const SUPPORT_URL = "https://www.feenicks1solutions.com";

/** Remembers "hide amounts" on this device (a convenience, not security). */
const HIDE_AMOUNTS_KEY = "feenicks1-hide-amounts";

/**
 * TODO(invest): real figures from the server once investing is built.
 * Zero until then; never fake numbers on a money screen.
 */
const PORTFOLIO_VALUE = 0;
const PROFIT_EARNED = 0;

/** "Good morning" / "Good afternoon" / "Good evening" by the user's clock. */
function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function readHideAmounts(): boolean {
  try {
    return window.localStorage.getItem(HIDE_AMOUNTS_KEY) === "1";
  } catch {
    return false;
  }
}

/** "GH₵ 1,240.50" → big whole part + small decimals, like banking apps. */
function BigAmount({ amount, hidden }: { amount: number; hidden: boolean }) {
  if (hidden) return <span aria-label="Amount hidden">GH₵ ••••••</span>;
  const [whole, decimals] = amount.toFixed(2).split(".");
  return (
    <>
      <span className="text-[1.375rem] font-medium opacity-80">GH₵ </span>
      {Number(whole).toLocaleString("en-GH")}
      <span className="text-[1.375rem] font-medium opacity-80">.{decimals}</span>
    </>
  );
}

export function DashboardScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // The dashboard only renders in the browser (AppLockGuard), so storage is safe here.
  const [hideAmounts, setHideAmounts] = useState(readHideAmounts);

  const toggleHideAmounts = () => {
    setHideAmounts((hidden) => {
      try {
        window.localStorage.setItem(HIDE_AMOUNTS_KEY, hidden ? "0" : "1");
      } catch {
        // Storage blocked: the choice just won't be remembered.
      }
      return !hidden;
    });
  };

  const handleLogOut = async () => {
    setIsLoggingOut(true);
    await logOut();
    router.replace(ROUTES.login);
  };

  // Always signed in here (AppLockGuard); this just narrows the type.
  if (current.status !== "signed-in") return null;

  const { firstName, riskLevel } = current.account;
  const initials = (firstName ?? "F1").slice(0, 2).toUpperCase();
  const bestMatch = riskLevel ? INVESTMENT_PACKAGES[PACKAGES_FOR_RISK_LEVEL[riskLevel][0]] : null;

  const quickAccess = [
    { label: "Packages", href: ROUTES.packages, icon: <GridIcon /> },
    {
      label: "Calculator",
      // The returns estimate lives on each package; open the best match (or the entry package).
      href: packageDetailsHref(bestMatch?.id ?? "mfc"),
      icon: <CalculatorIcon />,
    },
    {
      label: "Risk profile",
      href: riskLevel ? ROUTES.riskProfileResult : ROUTES.riskProfileQuestions,
      icon: <CompassIcon />,
    },
    { label: "Support", href: SUPPORT_URL, icon: <SupportIcon />, external: true },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* ── Balance header ─────────────────────────────────────── */}
      <header className="rounded-b-[2rem] bg-brand-600 px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 text-white">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-semibold"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] text-white/70">{greetingForNow()},</p>
            <h1 className="truncate text-base font-semibold">{firstName ?? "Welcome"}</h1>
          </div>
          <button
            type="button"
            onClick={handleLogOut}
            disabled={isLoggingOut}
            aria-label="Log out"
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/25 transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            <LogoutIcon className="size-5" />
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="flex items-center justify-center gap-2 text-[0.8125rem] text-white/75">
            Portfolio value
            <button
              type="button"
              onClick={toggleHideAmounts}
              aria-label={hideAmounts ? "Show amounts" : "Hide amounts"}
              aria-pressed={hideAmounts}
              className="-m-1.5 grid size-7 cursor-pointer place-items-center rounded-full hover:bg-white/10"
            >
              {hideAmounts ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
            </button>
          </p>
          <p className="mt-2 text-[2.25rem] leading-none font-semibold tracking-tight">
            <BigAmount amount={PORTFOLIO_VALUE} hidden={hideAmounts} />
          </p>
          <p className="mt-3 text-[0.8125rem] text-white/75">
            Profit earned{" "}
            <span className="font-semibold text-white">
              {hideAmounts ? "••••" : formatCedis(PROFIT_EARNED, { exact: true })}
            </span>
          </p>
        </div>

        {/* Actions: white pills, as in the reference. */}
        <div className="mt-7 grid grid-cols-2 gap-3">
          <Link
            href={ROUTES.packages}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            <ArrowRight className="size-4 -rotate-45" />
            Invest
          </Link>
          {/* Nothing to withdraw yet: shown, but unavailable (and says why). */}
          <button
            type="button"
            disabled
            title="Available once you have an investment"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 text-sm font-semibold text-white/60"
          >
            <ArrowRight className="size-4 rotate-[135deg]" />
            Withdraw
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-10 px-6 pt-8">
        {/* ── Quick access ───────────────────────────────────── */}
        <section aria-labelledby="quick-access-title">
          <h2 id="quick-access-title" className="text-[0.9375rem] font-semibold">
            Quick access
          </h2>
          <ul className="mt-4 grid grid-cols-4 gap-2">
            {quickAccess.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <span className="grid size-14 place-items-center rounded-full bg-neutral-100 text-brand-700 transition-colors group-hover:bg-brand-50 dark:bg-white/5 dark:text-brand-400 [&_svg]:size-6">
                    {item.icon}
                  </span>
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Your investments ───────────────────────────────── */}
        <section aria-labelledby="investments-title">
          <div className="flex items-baseline justify-between">
            <h2 id="investments-title" className="text-[0.9375rem] font-semibold">
              Your investments
            </h2>
            <Link href={ROUTES.packages} className="text-[0.8125rem] font-semibold text-brand-600 hover:underline">
              See packages
            </Link>
          </div>

          <div className="mt-4 rounded-3xl bg-neutral-100 p-5 dark:bg-white/5">
            <p className="text-sm font-semibold">You haven&apos;t invested yet</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-neutral-500">
              {bestMatch && riskLevel
                ? `Based on your ${RISK_LEVELS[riskLevel].name} profile, we suggest:`
                : "Pick a package to start growing your money."}
            </p>

            {bestMatch ? (
              <Link
                href={packageDetailsHref(bestMatch.id)}
                className="mt-4 flex items-center gap-3 rounded-2xl bg-background p-3.5 transition-colors hover:bg-white/70 dark:bg-white/5"
              >
                <PackageIcon pkg={bestMatch} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{bestMatch.name}</span>
                  <span className="block text-xs text-neutral-500">
                    {roiRangeLabel(bestMatch.monthlyRoiPercent)} a month · from{" "}
                    <span className="whitespace-nowrap">{formatCedis(bestMatch.minimum)}</span>
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 -rotate-45 text-brand-600" />
              </Link>
            ) : (
              <Link
                href={ROUTES.riskProfileQuestions}
                className="mt-4 inline-flex text-[0.8125rem] font-semibold text-brand-600 hover:underline"
              >
                Find packages that suit you
              </Link>
            )}
          </div>
        </section>

        {/* ── Recent activity ────────────────────────────────── */}
        <section aria-labelledby="activity-title">
          <h2 id="activity-title" className="text-[0.9375rem] font-semibold">
            Recent activity
          </h2>
          <div className="mt-4 flex items-center gap-3.5 rounded-3xl border border-neutral-100 p-5 dark:border-white/10">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-white/5">
              <ClockIcon className="size-5" />
            </span>
            <p className="text-[0.8125rem] leading-relaxed text-neutral-500">
              No activity yet. Your deposits, investments and returns will show here.
            </p>
          </div>
        </section>
      </main>

      <BottomTabBar />
    </div>
  );
}

/**
 * Bottom tab bar with a raised round centre button (Invest), as in the
 * reference. Fixed to the bottom of the screen.
 */
function BottomTabBar() {
  // Two tabs either side of the raised centre button.
  const tabs = [
    { label: "Home", href: ROUTES.dashboard, icon: <HomeIcon />, isActive: true },
    { label: "Packages", href: ROUTES.packages, icon: <GridIcon /> },
    { label: "Profile", href: ROUTES.riskProfileResult, icon: <CompassIcon /> },
    { label: "Support", href: SUPPORT_URL, icon: <SupportIcon />, external: true },
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-background pb-[env(safe-area-inset-bottom)] dark:border-white/10"
    >
      <ul className="relative mx-auto grid h-16 max-w-md grid-cols-[1fr_1fr_4.5rem_1fr_1fr] px-2">
        {tabs.map((tab, index) => (
          <li key={tab.label} className={cn(index === 2 && "col-start-4")}>
            <Link
              href={tab.href}
              aria-current={tab.isActive ? "page" : undefined}
              {...(tab.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium [&_svg]:size-[22px]",
                tab.isActive ? "text-brand-700 dark:text-brand-400" : "text-neutral-400 hover:text-neutral-600",
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          </li>
        ))}

        {/* Raised centre button: start investing. */}
        <li className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link
            href={ROUTES.packages}
            aria-label="Invest"
            className="grid size-14 place-items-center rounded-full bg-brand-600 text-white ring-4 ring-background transition-colors hover:bg-brand-700"
          >
            <PlusIcon className="size-6" />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
