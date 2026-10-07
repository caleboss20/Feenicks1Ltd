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
 *   │ [ + Invest ]  [ ↓ Withdraw ]  [⛶]            │   ← ⛶ = referral QR code (/refer)
 *   │                                              │
 *   │ ╭── swipeable white cards (BannerCarousel) ─╮ │
 *   ╰─│─ Invite a friend · Your best match · … ──│─╯   ← gradient turns white here
 *     ╰──────────────────────────────────────────╯
 *     Once they've invested, the carousel gives way to PerformanceCard: the
 *     portfolio's line over 1D–All, with the change (same maths as Analytics).
 *     (Its best-match and calculator offers would also point to a second
 *     package, which the one-package rule doesn't allow: packagePolicy.ts.)
 *
 *     Recent activity                         View all
 *     (↙) Return from InvestWise Capital  + GH₵ 108.00   ← RecentTransactions: the
 *         Transaction ID: … · 22 Sept, 8:26 am            latest 5 (or "No activity yet")
 *   ──────────────────────────────────────────────
 *    🏠 Home   📊 Analytics   🧾 Transactions   👤 Account   ← AppTabBar
 *
 * Not invested yet → FirstInvestmentSheet rises from the bottom (once per
 * log-in / PIN unlock).
 * Log out lives on the Account tab.
 * Honest by design: no made-up balances or transactions. Until investing is
 * built (TODO(invest)), amounts are GH₵ 0.00 and activity is empty.
 * Access and auto-lock: the (app) layout (AppLockGuard).
 */

import { useEffect, useState } from "react";
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
  ScanIcon,
  SupportIcon,
  TargetIcon,
  TriangleUpIcon,
} from "@/components/icons";
import { AppTabBar, appTabBarPadding } from "@/components/layout/AppTabBar";
import { packageDetailsHref } from "@/config/investingFlow";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import {
  currentValue,
  hasCompletedInvestment,
  totalProfit,
} from "@/features/analytics/portfolioHistory";
import { markOnboardingFinished } from "@/features/investor-profile/investorProfileService";
import { INVESTMENT_PACKAGES, PACKAGES_FOR_RISK_LEVEL } from "@/features/packages/investmentPackages";
import {
  REFERRAL_POINTS_LABEL,
  REFERRAL_REWARD_LABEL,
  shareReferralLink,
} from "@/features/referrals/referralService";
import { UnreadBadge } from "@/features/notifications/UnreadBadge";
import { useUnreadNotificationCount } from "@/features/notifications/useNotifications";
import { RecentTransactions } from "@/features/transactions/RecentTransactions";
import { useTransactions } from "@/features/transactions/useTransactions";
import { CEDI_SYMBOL, formatCedis, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { type Banner, BannerCarousel } from "./BannerCarousel";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { useThemeStore } from "@/stores/useThemeStore";
import { chosenDashboardColor, dashboardGradient } from "./dashboardTheme";
import { FirstInvestmentSheet } from "./FirstInvestmentSheet";
import { PerformanceCard } from "./PerformanceCard";

/** Remembers "hide amounts" on this device (a convenience, not security). */
const HIDE_AMOUNTS_KEY = "feenicks1-hide-amounts";

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

function saveHideAmounts(hidden: boolean) {
  try {
    window.localStorage.setItem(HIDE_AMOUNTS_KEY, hidden ? "1" : "0");
  } catch {
    // Storage blocked: the choice just won't be remembered.
  }
}

export function DashboardScreen() {
  const current = useCurrentAccount();
  // Value and profit come from the transaction history (same maths as
  // Analytics): GH₵ 0.00 until there's real activity; never made-up numbers.
  const transactions = useTransactions();
  const portfolioValue = transactions ? currentValue(transactions) : 0;
  const profitEarned = transactions ? totalProfit(transactions) : 0;
  /** null while loading (so the first-investment sheet waits until we know). */
  const hasInvested = transactions ? hasCompletedInvestment(transactions) : null;
  // The dashboard only renders in the browser (AppLockGuard), so storage is safe here.
  const [hideAmounts, setHideAmounts] = useState(readHideAmounts);
  // The colour they chose for the top (Account › Dashboard colour), and the
  // phone's status bar in its deepest shade, so the two blend.
  const color = chosenDashboardColor(
    useThemeStore((state) => state.dashboardColor),
    useThemeStore((state) => state.customDashboardColor),
  );
  useStatusBarColor({ light: color.top, dark: color.top });
  // A dot on the bell when something new happened (real events only).
  const unreadNotifications = useUnreadNotificationCount();

  // Reaching the dashboard ends the start-investing journey: from now on its
  // screens hand over to the in-app versions (Invest, Account › Investor profile).
  const needsOnboardingFinished =
    current.status === "signed-in" && !current.account.hasFinishedOnboarding;
  useEffect(() => {
    if (needsOnboardingFinished) void markOnboardingFinished();
  }, [needsOnboardingFinished]);

  const toggleHideAmounts = () => {
    setHideAmounts((hidden) => {
      saveHideAmounts(!hidden);
      return !hidden;
    });
  };

  // Privacy: leaving the app (another app, the home screen, locking the
  // phone) hides the amounts, so whoever sees the screen on the way back in
  // (or the phone's app switcher) sees dots, not money. The eye shows them
  // again. Saved, so it holds even if the phone closes the app meanwhile.
  useEffect(() => {
    const hideOnLeave = () => {
      if (document.visibilityState !== "hidden") return;
      setHideAmounts(true);
      saveHideAmounts(true);
    };
    document.addEventListener("visibilitychange", hideOnLeave);
    window.addEventListener("pagehide", hideOnLeave);
    return () => {
      document.removeEventListener("visibilitychange", hideOnLeave);
      window.removeEventListener("pagehide", hideOnLeave);
    };
  }, []);

  // Always signed in here (AppLockGuard); this just narrows the type.
  if (current.status !== "signed-in") return null;

  const { email, firstName, riskLevel, avatarUrl, unlockedAt } = current.account;
  const initials = (firstName ?? "F1").slice(0, 2).toUpperCase();
  const bestMatch = INVESTMENT_PACKAGES[riskLevel ? PACKAGES_FOR_RISK_LEVEL[riskLevel][0] : "mfc"];
  const [lowestRoi, highestRoi] = bestMatch.monthlyRoiPercent;
  // The returns calculator lives on each package: open the best match.
  const calculatorHref = packageDetailsHref(bestMatch.id);

  // The balance, split so the pesewas can be drawn smaller: "1,250" + "50".
  const [balanceWhole, balanceFraction] = formatCedisNumber(portfolioValue, { exact: true }).split(".");

  /** Cards in the swipeable carousel, all built from real data (no made-up offers). */
  const banners: Banner[] = [
    {
      id: "invite",
      icon: <GiftIcon />,
      title: "Invite a friend",
      text: (
        <>
          Earn{" "}
          <strong>
            {REFERRAL_POINTS_LABEL} ({REFERRAL_REWARD_LABEL})
          </strong>{" "}
          for every friend who signs up with your link.
        </>
      ),
      action: {
        label: "Invite for free",
        onClick: async () => ((await shareReferralLink(email)) === "copied" ? "copied" : "done"),
      },
    },
    {
      id: "withdrawals",
      icon: <ClockIcon />,
      title: "How withdrawals work",
      text: (
        <>
          Learn when taking money out is <strong>free</strong>, and when a small fee applies.
        </>
      ),
      action: { label: "See how it works", href: ROUTES.withdrawGuide },
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
          action: { label: "Get matched", href: ROUTES.investorProfileQuestions },
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

  const headerIconButton =
    "grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white/15 min-[360px]:size-11 text-white transition-colors hover:bg-white/25 [&_svg]:size-5";
  const whiteButton =
    "flex h-13 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white text-xs font-semibold min-[360px]:gap-2 min-[360px]:text-[0.8125rem] text-neutral-900 transition-colors hover:bg-neutral-50 [&_svg]:size-[18px]";

  return (
    <div
      className={cn(
        "relative isolate mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background",
        appTabBarPadding,
      )}
    >
      {/* Their colour (green by default) at the top, fading into the page
          behind the cards; for investors, solid behind the chart's white
          title, then a quicker fade behind the top of the chart. */}
      <div
        aria-hidden
        style={{ backgroundImage: dashboardGradient(color, { withChart: Boolean(hasInvested) }) }}
        className="absolute inset-x-0 top-0 -z-10 h-[31rem]"
      />

      {/* ── Greeting ─────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 min-[360px]:gap-3.5 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        {/* Photo (or initials): opens the Account screen. */}
        <Link href={ROUTES.account} aria-label="Your account" className="shrink-0 rounded-full">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={48}
              height={48}
              unoptimized // a small local thumbnail: nothing to optimise
              className="size-12 rounded-full object-cover ring-2 ring-white/30"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-12 place-items-center rounded-full bg-white/20 text-[0.9375rem] font-semibold"
            >
              {initials}
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-white/80">
            {greetingForNow()} <span aria-hidden>👋</span>
          </p>
          <h1 className="mt-0.5 truncate text-base font-semibold tracking-tight">
            {firstName ?? "Welcome"}
          </h1>
        </div>
        <Link href={ROUTES.support} aria-label="Help & support" className={headerIconButton}>
          <SupportIcon />
        </Link>
        <Link
          href={ROUTES.notifications}
          aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} new` : "Notifications"}
          className={cn(headerIconButton, "relative")}
        >
          <BellIcon />
          {/* How many new things happened on the account (1–9, then 9+), ringed in the top colour. */}
          <UnreadBadge
            count={unreadNotifications}
            className="ring-(--badge-ring)"
            style={{ "--badge-ring": color.top } as React.CSSProperties}
          />
        </Link>
      </header>

      {/* ── Balance ──────────────────────────────────────────────── */}
      <section aria-label="Your portfolio" className="mt-11 px-5 text-white">
        <p className="text-xs font-medium text-white/85">Portfolio value</p>

        <div className="mt-3.5 flex items-center gap-3">
          <p className="flex items-baseline gap-2 leading-none">
            <span className="text-xl font-semibold text-white/90">{CEDI_SYMBOL}</span>
            {hideAmounts ? (
              <span aria-label="Amount hidden" className="text-[2.0625rem] font-bold tracking-[0.1em]">
                ••••••
              </span>
            ) : (
              <span className="text-[2.6875rem] font-bold tracking-[-0.03em] tabular-nums">
                {balanceWhole}
                <span className="text-[1.6875rem] text-white/80">.{balanceFraction}</span>
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

        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 py-1.5 pr-3.5 pl-1.5 text-xs text-white/90">
          {/* Stock-ticker arrow: green ▲ for a gain (or nothing yet), red ▼ for a loss. */}
          <span className="grid size-6 place-items-center rounded-full bg-white">
            <TriangleUpIcon
              className={cn(
                "size-3",
                profitEarned < 0 ? "rotate-180 text-red-600" : "text-brand-600",
              )}
            />
          </span>
          Profit earned
          <span className="font-semibold text-white">
            {hideAmounts ? "••••" : formatCedis(profitEarned, { exact: true })}
          </span>
        </p>
      </section>

      {/* ── Actions: two white buttons and a dark square ─────────── */}
      <div className="mt-10 flex gap-2.5 px-5 min-[360px]:gap-3">
        <Link href={ROUTES.invest} className={whiteButton}>
          <PlusIcon />
          Invest
        </Link>
        <Link href={ROUTES.withdraw} className={whiteButton}>
          <ArrowRight className="rotate-90" />
          Withdraw
        </Link>
        {/* Referral QR code for a friend to scan (like the reference's scan button). */}
        <Link
          href={ROUTES.refer}
          aria-label="Invite a friend with your QR code"
          title="Invite a friend with your QR code"
          className="grid size-13 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-950"
        >
          <ScanIcon className="size-[22px]" />
        </Link>
      </div>

      {/* ── Cards, where the green fades into white: how the portfolio is
             doing once they've invested; offers and tips until then ─── */}
      {/* Investors: the chart's title sits closer, inside the solid green. */}
      <div className={cn("px-4", hasInvested ? "mt-7" : "mt-10")}>
        {transactions === null ? (
          // Loading (a moment): empty space, so neither flashes up.
          <div aria-hidden className="h-48" />
        ) : hasInvested ? (
          <PerformanceCard transactions={transactions} hideAmounts={hideAmounts} color={color} />
        ) : (
          <BannerCarousel label="Offers and tips" banners={banners} />
        )}
      </div>

      {/* ── Recent activity: the latest transactions (all of them on the Transactions tab) ── */}
      <div className="mt-12 px-4">
        <RecentTransactions transactions={transactions} hideAmounts={hideAmounts} />
      </div>

      <AppTabBar />

      {/* Not invested yet: a milestone sheet nudging the first investment. */}
      <FirstInvestmentSheet hasInvested={hasInvested ?? true} visitId={unlockedAt} />
    </div>
  );
}
