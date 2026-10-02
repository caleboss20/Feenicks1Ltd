"use client";

/**
 * Dashboard (Home): a green gradient top that fades into white, after the
 * user's reference (a blue banking home), in Feenicks1 green. Dark-mode
 * styles are ready for the Settings toggle.
 *
 *   ┌─────────── brand green, fading down ─────────┐
 *   │ (📷) Good morning 👋                (🎧) (🔔) │   ← support, notifications
 *   │      Ama                                     │
 *   │                                              │
 *   │ Portfolio value                              │
 *   │ GH₵ 0.00  (👁)                               │   ← big; eye hides amounts
 *   │ (▲ Profit earned GH₵ 0.00)                   │   ← stock-ticker arrow
 *   │                                              │
 *   │ [ + Invest ]  [ ↓ Withdraw ]  [■]            │   ← ■ = returns calculator
 *   │                                              │
 *   │ ╭── swipeable white cards (BannerCarousel) ─╮ │
 *   ╰─│─ Invite a friend · Your best match · … ──│─╯   ← gradient turns white here
 *     ╰──────────────────────────────────────────╯
 *
 *     Recent activity
 *     (All) (Investments) (Withdrawals)
 *     🕓 No activity yet …
 *   ──────────────────────────────────────────────
 *    🏠 Home   📊 Analytics   🧾 Transactions   👤 Account   ← AppTabBar
 *
 * Log out lives on the Account tab.
 * Honest by design: no made-up balances or transactions. Until investing is
 * built (TODO(invest)), amounts are GH₵ 0.00 and activity is empty.
 * Access and auto-lock: the (app) layout (AppLockGuard).
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BellIcon,
  CalculatorIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  GiftIcon,
  PlusIcon,
  SupportIcon,
  TargetIcon,
  TriangleUpIcon,
} from "@/components/icons";
import { AppTabBar, appTabBarPadding } from "@/components/layout/AppTabBar";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import {
  INVESTMENT_PACKAGES,
  PACKAGES_FOR_RISK_LEVEL,
  packageDetailsHref,
} from "@/features/packages/investmentPackages";
import { REFERRAL_REWARD_LABEL, shareReferralLink } from "@/features/referrals/referralService";
import { CEDI_SYMBOL, formatCedis, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { type Banner, BannerCarousel } from "./BannerCarousel";
import { DASHBOARD_TOP_GRADIENT } from "./dashboardTheme";

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

/** Filters above the activity list. */
const ACTIVITY_FILTERS = {
  all: {
    label: "All",
    emptyTitle: "No activity yet",
    emptyText: "Your investments, returns and withdrawals will show here.",
  },
  investments: {
    label: "Investments",
    emptyTitle: "No investments yet",
    emptyText: "Choose a package to make your first investment.",
  },
  withdrawals: {
    label: "Withdrawals",
    emptyTitle: "No withdrawals yet",
    emptyText: "Money you withdraw from your investments will show here.",
  },
} as const;
type ActivityFilter = keyof typeof ACTIVITY_FILTERS;

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

export function DashboardScreen() {
  const current = useCurrentAccount();
  // The dashboard only renders in the browser (AppLockGuard), so storage is safe here.
  const [hideAmounts, setHideAmounts] = useState(readHideAmounts);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

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

  // Always signed in here (AppLockGuard); this just narrows the type.
  if (current.status !== "signed-in") return null;

  const { email, firstName, riskLevel, avatarUrl } = current.account;
  const initials = (firstName ?? "F1").slice(0, 2).toUpperCase();
  const bestMatch = INVESTMENT_PACKAGES[riskLevel ? PACKAGES_FOR_RISK_LEVEL[riskLevel][0] : "mfc"];
  const [lowestRoi, highestRoi] = bestMatch.monthlyRoiPercent;
  // The returns calculator lives on each package: open the best match.
  const calculatorHref = packageDetailsHref(bestMatch.id);

  // The balance, split so the pesewas can be drawn smaller: "1,250" + "50".
  const [balanceWhole, balanceFraction] = formatCedisNumber(PORTFOLIO_VALUE, { exact: true }).split(".");

  /** Cards in the swipeable carousel, all built from real data (no made-up offers). */
  const banners: Banner[] = [
    {
      id: "invite",
      icon: <GiftIcon />,
      title: "Invite a friend",
      text: (
        <>
          Earn <strong>{REFERRAL_REWARD_LABEL}</strong> for every friend who signs up with your
          link.
        </>
      ),
      action: {
        label: "Invite for free",
        onClick: async () => ((await shareReferralLink(email)) === "copied" ? "copied" : "done"),
      },
    },
    riskLevel
      ? {
          id: "best-match",
          icon: <TargetIcon />,
          title: "Your best match",
          text: (
            <>
              <strong>{bestMatch.name}</strong> matches your investor profile, with an expected{" "}
              <strong className="whitespace-nowrap">
                {lowestRoi}–{highestRoi}% a month
              </strong>
              .
            </>
          ),
          action: { label: "View package", href: packageDetailsHref(bestMatch.id) },
        }
      : {
          id: "best-match",
          icon: <TargetIcon />,
          title: "Find your package",
          text: (
            <>
              Answer a few quick questions and we&apos;ll <strong>match you</strong> to the right
              package.
            </>
          ),
          action: { label: "Get matched", href: ROUTES.startInvesting },
        },
    {
      id: "calculator",
      icon: <CalculatorIcon />,
      title: "Returns calculator",
      text: (
        <>
          See what <strong>{bestMatch.name}</strong> could earn you{" "}
          <strong>before you invest</strong>.
        </>
      ),
      action: { label: "Try the calculator", href: calculatorHref },
    },
  ];

  const filter = ACTIVITY_FILTERS[activityFilter];
  const headerIconButton =
    "grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white/15 min-[360px]:size-11 text-white transition-colors hover:bg-white/25 [&_svg]:size-5";
  const whiteButton =
    "flex h-13 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-semibold min-[360px]:gap-2 min-[360px]:text-[0.9375rem] text-neutral-900 transition-colors hover:bg-neutral-50 [&_svg]:size-5";

  return (
    <div
      className={cn(
        "relative isolate mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background",
        appTabBarPadding,
      )}
    >
      {/* Green at the top, fading into the page background behind the cards. */}
      <div
        aria-hidden
        style={{ backgroundImage: DASHBOARD_TOP_GRADIENT }}
        className="absolute inset-x-0 top-0 -z-10 h-[31rem]"
      />

      {/* ── Greeting ─────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 min-[360px]:gap-3.5 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={48}
            height={48}
            unoptimized // a small local thumbnail: nothing to optimise
            className="size-12 shrink-0 rounded-full object-cover ring-2 ring-white/30"
          />
        ) : (
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-full bg-white/20 text-[0.9375rem] font-semibold"
          >
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.8125rem] text-white/80">
            {greetingForNow()} <span aria-hidden>👋</span>
          </p>
          <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight">
            {firstName ?? "Welcome"}
          </h1>
        </div>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Support"
          className={headerIconButton}
        >
          <SupportIcon />
        </a>
        <Link href={ROUTES.notifications} aria-label="Notifications" className={headerIconButton}>
          <BellIcon />
        </Link>
      </header>

      {/* ── Balance ──────────────────────────────────────────────── */}
      <section aria-label="Your portfolio" className="mt-11 px-5 text-white">
        <p className="text-sm font-medium text-white/85">Portfolio value</p>

        <div className="mt-3.5 flex items-center gap-3">
          <p className="flex items-baseline gap-2 leading-none">
            <span className="text-2xl font-semibold text-white/90">{CEDI_SYMBOL}</span>
            {hideAmounts ? (
              <span aria-label="Amount hidden" className="text-[2.25rem] font-bold tracking-[0.1em]">
                ••••••
              </span>
            ) : (
              <span className="text-[2.875rem] font-bold tracking-[-0.03em] tabular-nums">
                {balanceWhole}
                <span className="text-[1.875rem] text-white/80">.{balanceFraction}</span>
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={toggleHideAmounts}
            aria-label="Hide amounts"
            aria-pressed={hideAmounts}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {hideAmounts ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
          </button>
        </div>

        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 py-1.5 pr-3.5 pl-1.5 text-[0.8125rem] text-white/90">
          {/* Stock-ticker arrow: green ▲ for a gain (or nothing yet), red ▼ for a loss. */}
          <span className="grid size-6 place-items-center rounded-full bg-white">
            <TriangleUpIcon
              className={cn(
                "size-3",
                PROFIT_EARNED < 0 ? "rotate-180 text-red-600" : "text-brand-600",
              )}
            />
          </span>
          Profit earned
          <span className="font-semibold text-white">
            {hideAmounts ? "••••" : formatCedis(PROFIT_EARNED, { exact: true })}
          </span>
        </p>
      </section>

      {/* ── Actions: two white buttons and a dark square ─────────── */}
      <div className="mt-10 flex gap-2.5 px-5 min-[360px]:gap-3">
        <Link href={ROUTES.packages} className={whiteButton}>
          <PlusIcon />
          Invest
        </Link>
        <Link href={ROUTES.withdraw} className={whiteButton}>
          <ArrowRight className="rotate-90" />
          Withdraw
        </Link>
        <Link
          href={calculatorHref}
          aria-label="Returns calculator"
          title="Returns calculator"
          className="grid size-13 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-950"
        >
          <CalculatorIcon className="size-5" />
        </Link>
      </div>

      {/* ── Cards, where the green fades into white ─────────────── */}
      <div className="mt-10 px-4">
        <BannerCarousel label="Offers and tips" banners={banners} />
      </div>

      {/* ── Recent activity ──────────────────────────────────────── */}
      <section aria-labelledby="activity-title" className="mt-12 px-4">
        <h2 id="activity-title" className="text-lg font-semibold tracking-tight">
          Recent activity
        </h2>

        <div role="group" aria-label="Show" className="mt-4 flex gap-2">
          {(Object.keys(ACTIVITY_FILTERS) as ActivityFilter[]).map((key) => {
            const isActive = key === activityFilter;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActivityFilter(key)}
                className={cn(
                  "h-9 cursor-pointer rounded-full px-4 text-[0.8125rem] font-medium transition-colors",
                  isActive
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-300",
                )}
              >
                {ACTIVITY_FILTERS[key].label}
              </button>
            );
          })}
        </div>

        {/* TODO(invest): the list of transactions once investing exists. */}
        <div className="mt-6 flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-white/10">
            <ClockIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.9375rem] font-medium">{filter.emptyTitle}</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
              {filter.emptyText}
            </p>
          </div>
        </div>
      </section>

      <AppTabBar />
    </div>
  );
}
