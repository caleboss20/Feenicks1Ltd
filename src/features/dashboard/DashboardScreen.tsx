"use client";

/**
 * Dashboard (Home): a green gradient top that fades into white, after the
 * user's reference (a blue banking home), in Feenicks1 green. Dark-mode
 * styles are ready for the Settings toggle.
 *
 *   ┌─────────── brand green, fading down ─────────┐
 *   │ (📷) Good morning 👋                (🎧) (⇥) │   ← support, log out
 *   │      Ama                                     │
 *   │ Portfolio value                              │
 *   │ GH₵ 0.00  (👁)                               │   ← eye: hide amounts
 *   │ Profit earned GH₵ 0.00                       │
 *   │ [ + Invest ]  [ ↓ Withdraw ]  [■]            │   ← ■ = returns calculator
 *   │ ╭── swipeable white cards (BannerCarousel) ─╮ │
 *   ╰─│─ Invite a friend · Your best match · … ──│─╯   ← gradient turns white here
 *     ╰──────────────────────────────────────────╯
 *     Recent activity
 *     (All) (Investments) (Withdrawals)
 *     🕓 No activity yet …
 *   ──────────────────────────────────────────────
 *    🏠 Home   📊 Analytics   🧾 Transactions   👤 Account   ← AppTabBar
 *
 * Honest by design: no made-up balances or transactions. Until investing is
 * built (TODO(invest)), amounts are GH₵ 0.00 and activity is empty.
 * Access and auto-lock: the (app) layout (AppLockGuard).
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalculatorIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  GiftIcon,
  LogoutIcon,
  PlusIcon,
  SupportIcon,
  TargetIcon,
} from "@/components/icons";
import { AppTabBar, appTabBarPadding } from "@/components/layout/AppTabBar";
import { ROUTES } from "@/config/routes";
import { logOut } from "@/features/auth/authService";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import {
  INVESTMENT_PACKAGES,
  PACKAGES_FOR_RISK_LEVEL,
  packageDetailsHref,
} from "@/features/packages/investmentPackages";
import { REFERRAL_REWARD_LABEL, shareReferralLink } from "@/features/referrals/referralService";
import { formatCedis } from "@/lib/money";
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
  const router = useRouter();
  const current = useCurrentAccount();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  const handleLogOut = async () => {
    setIsLoggingOut(true);
    await logOut();
    router.replace(ROUTES.login);
  };

  // Always signed in here (AppLockGuard); this just narrows the type.
  if (current.status !== "signed-in") return null;

  const { email, firstName, riskLevel, avatarUrl } = current.account;
  const initials = (firstName ?? "F1").slice(0, 2).toUpperCase();
  const bestMatch = INVESTMENT_PACKAGES[riskLevel ? PACKAGES_FOR_RISK_LEVEL[riskLevel][0] : "mfc"];
  // The returns calculator lives on each package: open the best match.
  const calculatorHref = packageDetailsHref(bestMatch.id);

  const [lowestRoi, highestRoi] = bestMatch.monthlyRoiPercent;

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
    "grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 disabled:opacity-60 [&_svg]:size-[18px]";
  const whiteButton =
    "flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold [&_svg]:size-[18px]";

  return (
    <div
      className={cn(
        "relative isolate mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background",
        appTabBarPadding,
      )}
    >
      {/* Green at the top, fading into the page background behind the banners. */}
      <div
        aria-hidden
        style={{ backgroundImage: DASHBOARD_TOP_GRADIENT }}
        className="absolute inset-x-0 top-0 -z-10 h-[26.5rem]"
      />

      {/* ── Greeting ─────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={44}
            height={44}
            unoptimized // a small local thumbnail: nothing to optimise
            className="size-11 shrink-0 rounded-full object-cover ring-2 ring-white/30"
          />
        ) : (
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white/20 text-sm font-semibold"
          >
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/80">
            {greetingForNow()} <span aria-hidden>👋</span>
          </p>
          <h1 className="truncate text-base font-semibold">{firstName ?? "Welcome"}</h1>
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
        <button
          type="button"
          onClick={handleLogOut}
          disabled={isLoggingOut}
          aria-label="Log out"
          className={headerIconButton}
        >
          <LogoutIcon />
        </button>
      </header>

      {/* ── Balance ──────────────────────────────────────────────── */}
      <section aria-label="Your portfolio" className="mt-7 px-5 text-white">
        <p className="text-[0.8125rem] text-white/80">Portfolio value</p>
        <div className="mt-1 flex items-center gap-1.5">
          <p className="text-[2.125rem] leading-tight font-semibold tracking-tight">
            {hideAmounts ? (
              <span aria-label="Amount hidden">GH₵ ••••••</span>
            ) : (
              formatCedis(PORTFOLIO_VALUE, { exact: true })
            )}
          </p>
          <button
            type="button"
            onClick={toggleHideAmounts}
            aria-label="Hide amounts"
            aria-pressed={hideAmounts}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            {hideAmounts ? <EyeOffIcon className="size-[18px]" /> : <EyeIcon className="size-[18px]" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-white/80">
          Profit earned{" "}
          <span className="font-semibold text-white">
            {hideAmounts ? "••••" : formatCedis(PROFIT_EARNED, { exact: true })}
          </span>
        </p>
      </section>

      {/* ── Actions: two white buttons and a dark square ─────────── */}
      <div className="mt-6 flex gap-2.5 px-5">
        <Link href={ROUTES.packages} className={cn(whiteButton, "text-neutral-900 transition-colors hover:bg-neutral-50")}>
          <PlusIcon />
          Invest
        </Link>
        {/* Nothing to withdraw yet: shown, but unavailable until there's an investment. */}
        <span
          aria-disabled="true"
          title="Available once you have an investment"
          className={cn(whiteButton, "cursor-not-allowed text-neutral-400")}
        >
          <ArrowRight className="rotate-90" />
          Withdraw
        </span>
        <Link
          href={calculatorHref}
          aria-label="Returns calculator"
          title="Returns calculator"
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-950"
        >
          <CalculatorIcon className="size-5" />
        </Link>
      </div>

      {/* ── Banners, where the green fades into white ───────────── */}
      <div className="mt-6 px-4">
        <BannerCarousel label="Offers and tips" banners={banners} />
      </div>

      {/* ── Recent activity ──────────────────────────────────────── */}
      <section aria-labelledby="activity-title" className="mt-8 px-4">
        <h2 id="activity-title" className="text-base font-semibold">
          Recent activity
        </h2>

        <div role="group" aria-label="Show" className="mt-3 flex gap-2">
          {(Object.keys(ACTIVITY_FILTERS) as ActivityFilter[]).map((key) => {
            const isActive = key === activityFilter;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActivityFilter(key)}
                className={cn(
                  "h-8 cursor-pointer rounded-full px-3.5 text-xs font-medium transition-colors",
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
        <div className="mt-4 flex items-center gap-3.5 py-1">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-white/10">
            <ClockIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{filter.emptyTitle}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {filter.emptyText}
            </p>
          </div>
        </div>
      </section>

      <AppTabBar />
    </div>
  );
}
