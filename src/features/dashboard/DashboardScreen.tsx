"use client";

/**
 * Dashboard (Home), after the "EzFunds" reference, in Feenicks1 green on
 * white (with dark-mode styles ready for the Settings toggle).
 *
 *   ┌──────── full-width green top section ────────┐
 *   │ (📷) Good morning,                 (👁) (⇥)  │   ← hide amounts, log out
 *   │      Ama                                     │
 *   │               Portfolio value                │
 *   │                GH₵ 0.00                      │   ← big, centred
 *   │          ↗ Profit earned GH₵ 0.00            │
 *   │    (↗)      (↙)        (🧮)        (▦)       │   ← round see-through buttons
 *   │   Invest  Withdraw  Calculator  Packages     │
 *   └──────────────────────────────────────────────┘
 *     ╭──── green silk banner (overlaps) ────╮
 *     │ Invite a friend · Earn GH₵ 20 …      │
 *     ╰───────────────────────────────────────╯
 *     Recent activity …
 *   ──────────────────────────────────────────────
 *    🏠 Home   ▦ Packages   🎧 Support   🧭 Profile   ← plain white tab bar
 *
 * Honest by design: no made-up balances or transactions. Until investing is
 * built (TODO(invest)), amounts are GH₵ 0.00 and activity is empty.
 * Access and auto-lock: the (app) layout (AppLockGuard).
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalculatorIcon,
  CheckIcon,
  ClockIcon,
  CompassIcon,
  EyeIcon,
  EyeOffIcon,
  GridIcon,
  HomeIcon,
  LogoutIcon,
  SupportIcon,
} from "@/components/icons";
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

/** Company website, for "Support" until in-app support exists. */
const SUPPORT_URL = "https://www.feenicks1solutions.com";

/**
 * Background of the "Invite a friend" banner.
 * ⚠️ Confirm the licence of this photo (or replace it) before launch.
 */
const INVITE_BANNER_IMAGE = "/illustrations/banner-silk-green.jpg";

/** Remembers "hide amounts" on this device (a convenience, not security). */
const HIDE_AMOUNTS_KEY = "feenicks1-hide-amounts";

/**
 * TODO(invest): real figures from the server once investing is built.
 * Zero until then; never fake numbers on a money screen.
 */
const PORTFOLIO_VALUE = 0;
const PROFIT_EARNED = 0;

/**
 * Top section background: deep brand green at the top, softening lower
 * down, like the reference's sky. Built from the brand greens (never neon).
 */
const TOP_SECTION_BACKGROUND =
  "bg-[radial-gradient(120%_90%_at_50%_0%,#2fab66_0%,#15803d_55%,#116a33_100%)]";

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
  const bestMatchId = riskLevel ? PACKAGES_FOR_RISK_LEVEL[riskLevel][0] : "mfc";

  /** The four round buttons under the balance. */
  const actions = [
    { label: "Invest", href: ROUTES.packages, icon: <ArrowRight className="-rotate-45" /> },
    // Nothing to withdraw yet: shown, but unavailable until there's an investment.
    { label: "Withdraw", href: null, icon: <ArrowRight className="rotate-[135deg]" /> },
    {
      label: "Calculator",
      // The returns estimate lives on each package: open the best match.
      href: packageDetailsHref(INVESTMENT_PACKAGES[bestMatchId].id),
      icon: <CalculatorIcon />,
    },
    { label: "Packages", href: ROUTES.packages, icon: <GridIcon /> },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* ── Full-width top section ─────────────────────────────── */}
      <header
        className={cn(
          "px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-16 text-white",
          TOP_SECTION_BACKGROUND,
        )}
      >
        <div className="flex items-center gap-3">
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
              className="grid size-11 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-semibold"
            >
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] text-white/75">{greetingForNow()},</p>
            <h1 className="truncate text-base font-semibold">{firstName ?? "Welcome"}</h1>
          </div>
          <button
            type="button"
            onClick={toggleHideAmounts}
            aria-label={hideAmounts ? "Show amounts" : "Hide amounts"}
            aria-pressed={hideAmounts}
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10"
          >
            {hideAmounts ? <EyeIcon className="size-5" /> : <EyeOffIcon className="size-5" />}
          </button>
          <button
            type="button"
            onClick={handleLogOut}
            disabled={isLoggingOut}
            aria-label="Log out"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            <LogoutIcon className="size-5" />
          </button>
        </div>

        {/* Balance, centred, with today's profit underneath. */}
        <div className="mt-8 text-center">
          <p className="text-[0.8125rem] text-white/80">Portfolio value</p>
          <p className="mt-2 text-[2.5rem] leading-none font-semibold tracking-tight">
            {hideAmounts ? (
              <span aria-label="Amount hidden">GH₵ ••••••</span>
            ) : (
              formatCedis(PORTFOLIO_VALUE, { exact: true })
            )}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs text-white/90">
            <ArrowRight className="size-3.5 -rotate-45" />
            Profit earned{" "}
            <span className="font-semibold text-white">
              {hideAmounts ? "••••" : formatCedis(PROFIT_EARNED, { exact: true })}
            </span>
          </p>
        </div>

        {/* Four round, see-through buttons with labels underneath. */}
        <ul className="mt-8 grid grid-cols-4">
          {actions.map((action) => {
            const circle =
              "grid size-13 place-items-center rounded-full border border-white/25 bg-white/15 transition-colors [&_svg]:size-5";
            const content = (
              <>
                <span className={circle}>{action.icon}</span>
                <span className="text-xs font-medium">{action.label}</span>
              </>
            );
            return (
              <li key={action.label}>
                {action.href ? (
                  <Link
                    href={action.href}
                    className="group flex flex-col items-center gap-2 [&>span:first-child]:group-hover:bg-white/25"
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title="Available once you have an investment"
                    className="flex flex-col items-center gap-2 opacity-55"
                  >
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </header>

      {/* Content sits on white, the banner overlapping the green above. */}
      <div className="-mt-8 flex flex-col gap-4 px-4">
        <InviteBanner email={email} />

        <section aria-labelledby="activity-title" className="pt-2">
          <h2 id="activity-title" className="text-base font-semibold">
            Recent activity
          </h2>
          <div className="mt-4 flex items-center gap-3.5 rounded-3xl bg-neutral-50 p-5 dark:bg-white/5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background text-neutral-500 dark:bg-white/10">
              <ClockIcon className="size-5" />
            </span>
            <p className="text-[0.8125rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
              No activity yet. Your deposits, investments and returns will show here.
            </p>
          </div>
        </section>
      </div>

      <BottomTabBar />
    </div>
  );
}

/**
 * "Invite a friend" banner on a green silk photo. "Invite for free" opens
 * the phone's share sheet (WhatsApp, SMS…) or copies the link on desktop.
 */
function InviteBanner({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  // Put the button back to "Invite for free" after a moment.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const invite = async () => {
    const result = await shareReferralLink(email);
    if (result === "copied") setCopied(true);
  };

  return (
    <section
      aria-labelledby="invite-title"
      className="relative overflow-hidden rounded-[1.75rem] text-white"
    >
      <Image
        src={INVITE_BANNER_IMAGE}
        alt=""
        fill
        sizes="(min-width: 448px) 416px, 100vw"
        className="object-cover"
      />
      {/* Darker on the left so the text always reads clearly. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-black/45 via-black/15 to-transparent"
      />

      <div className="relative px-5 py-5">
        <h2 id="invite-title" className="text-lg font-semibold">
          Invite a friend
        </h2>
        <p className="mt-1 max-w-[13.5rem] text-[0.8125rem] leading-snug text-white/85">
          Earn {REFERRAL_REWARD_LABEL} for every friend who signs up.
        </p>
        <button
          type="button"
          onClick={invite}
          className="mt-4 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-white px-5 text-[0.8125rem] font-semibold text-brand-800 transition-colors hover:bg-brand-50"
        >
          {copied ? (
            <>
              <CheckIcon className="size-4" />
              Link copied
            </>
          ) : (
            "Invite for free"
          )}
        </button>
      </div>
    </section>
  );
}

/**
 * Plain white tab bar across the bottom: icon above label; the current tab
 * in brand green, the others grey (as in the reference).
 */
function BottomTabBar() {
  const tabs = [
    { label: "Home", href: ROUTES.dashboard, icon: <HomeIcon />, isActive: true },
    { label: "Packages", href: ROUTES.packages, icon: <GridIcon /> },
    { label: "Support", href: SUPPORT_URL, icon: <SupportIcon />, external: true },
    { label: "Profile", href: ROUTES.riskProfileResult, icon: <CompassIcon /> },
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-background pb-[env(safe-area-inset-bottom)] dark:border-white/10"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link
              href={tab.href}
              aria-current={tab.isActive ? "page" : undefined}
              {...(tab.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors [&_svg]:size-[22px]",
                tab.isActive
                  ? "text-brand-700 dark:text-brand-400"
                  : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
