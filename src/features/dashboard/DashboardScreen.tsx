"use client";

/**
 * Dashboard (Home), built after a premium fintech reference, in Feenicks1
 * green on white (with dark-mode styles ready for the Settings toggle).
 *
 *   ╭───────── green gradient card ─────────╮
 *   │ (📷) Good morning 👋          (🎧) (⇥) │   ← support, log out (deeper-tone circles)
 *   │      Ama Mensah                        │
 *   │ Portfolio value                        │
 *   │ GH₵ 0.00                         (👁)  │   ← big amount; eye on the right
 *   │ [ ↗ ]   [ ↙ ]    [ 🧮 ]     [ ▦ ]      │
 *   │ Invest Withdraw Calculator Packages    │   ← tiles one tone deeper than the card
 *   ╰────────────────────────────────────────╯
 *   ╭──── green silk photo ──────────────────╮
 *   │ Invite a friend                         │
 *   │ Earn GH₵ 20 for every friend…           │
 *   │ ( Invite for free )                     │   ← phone share sheet / copy link
 *   ╰────────────────────────────────────────╯
 *   ╭──── Recent activity ───────────────────╮
 *   │ No activity yet …                       │
 *   ╰────────────────────────────────────────╯
 *          ( 🏠 Home ) (▦) (🧭) (🎧)            ← floating capsule tab bar
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

/**
 * The balance card's background: a soft, even green gradient, lighter at
 * the top-right and deeper at the bottom-left (like the reference), never
 * neon. Built from the brand greens.
 */
const BALANCE_CARD_BACKGROUND =
  "bg-[radial-gradient(130%_115%_at_85%_0%,#86dfab_0%,#2fab66_40%,#15803d_100%)]";

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

  /** The four tiles on the green card. */
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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-2.5 bg-background px-2 pt-2 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      {/* ── Balance card (reaches the top of the screen, like the reference) ── */}
      <header
        className={cn(
          "rounded-[2rem] px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 text-white",
          BALANCE_CARD_BACKGROUND,
        )}
      >
        {/* Avatar, greeting and name · two round buttons in a deeper tone. */}
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={48}
              height={48}
              unoptimized // a small local thumbnail: nothing to optimise
              className="size-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-12 shrink-0 place-items-center rounded-full bg-black/15 text-sm font-semibold"
            >
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] text-white/80">{greetingForNow()} 👋</p>
            <h1 className="mt-0.5 truncate text-[1.0625rem] font-semibold">
              {firstName ?? "Welcome"}
            </h1>
          </div>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Support"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-black/15 transition-colors hover:bg-black/25"
          >
            <SupportIcon className="size-[18px]" />
          </a>
          <button
            type="button"
            onClick={handleLogOut}
            disabled={isLoggingOut}
            aria-label="Log out"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-black/15 transition-colors hover:bg-black/25 disabled:opacity-60"
          >
            <LogoutIcon className="size-[18px]" />
          </button>
        </div>

        {/* Label + big amount on the left, the eye (hide/show) on the right. */}
        <div className="mt-9 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-white/80">Portfolio value</p>
            <p className="mt-2 text-[2.375rem] leading-none font-semibold tracking-tight">
              {hideAmounts ? (
                <span aria-label="Amount hidden">GH₵ ••••••</span>
              ) : (
                formatCedis(PORTFOLIO_VALUE, { exact: true })
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleHideAmounts}
            aria-label={hideAmounts ? "Show amounts" : "Hide amounts"}
            aria-pressed={hideAmounts}
            className="-mr-1.5 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10"
          >
            {hideAmounts ? <EyeIcon className="size-5" /> : <EyeOffIcon className="size-5" />}
          </button>
        </div>

        {/* Four rounded tiles, one tone deeper than the card. */}
        <ul className="mt-7 grid grid-cols-4 gap-2">
          {actions.map((action) => {
            const tileClass =
              "flex h-[5.25rem] flex-col items-center justify-center gap-2 rounded-[1.375rem] bg-black/12 text-[0.8125rem] font-medium transition-colors [&_svg]:size-5";
            return (
              <li key={action.label}>
                {action.href ? (
                  <Link href={action.href} className={cn(tileClass, "hover:bg-black/20")}>
                    {action.icon}
                    {action.label}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title="Available once you have an investment"
                    className={cn(tileClass, "text-white/55")}
                  >
                    {action.icon}
                    {action.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </header>

      <InviteBanner email={email} />

      {/* ── Recent activity ────────────────────────────────────── */}
      <section
        aria-labelledby="activity-title"
        className="rounded-[2rem] bg-neutral-50 px-5 pt-5 pb-6 dark:bg-white/5"
      >
        <h2 id="activity-title" className="text-[0.9375rem] font-semibold">
          Recent activity
        </h2>
        <div className="mt-5 flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background text-neutral-500 dark:bg-white/10">
            <ClockIcon className="size-5" />
          </span>
          <p className="text-[0.8125rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
            No activity yet. Your deposits, investments and returns will show here.
          </p>
        </div>
      </section>

      <FloatingTabBar />
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
      className="relative overflow-hidden rounded-[2rem] text-white"
    >
      <Image
        src={INVITE_BANNER_IMAGE}
        alt=""
        fill
        sizes="(min-width: 448px) 424px, 100vw"
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
 * Floating capsule tab bar: the current tab is a white pill with its name;
 * the others are round icons. Dark capsule, so it stands out on white.
 */
function FloatingTabBar() {
  const otherTabs = [
    { label: "Packages", href: ROUTES.packages, icon: <GridIcon /> },
    { label: "Investor profile", href: ROUTES.riskProfileResult, icon: <CompassIcon /> },
    { label: "Support", href: SUPPORT_URL, icon: <SupportIcon />, external: true },
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex justify-center"
    >
      <ul className="flex items-center gap-1.5 rounded-full bg-neutral-900 p-1.5 dark:bg-neutral-800">
        <li>
          <Link
            href={ROUTES.dashboard}
            aria-current="page"
            className="flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-neutral-900"
          >
            <HomeIcon className="size-5 text-brand-600" />
            Home
          </Link>
        </li>
        {otherTabs.map((tab) => (
          <li key={tab.label}>
            <Link
              href={tab.href}
              aria-label={tab.label}
              {...(tab.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="grid size-12 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white [&_svg]:size-5"
            >
              {tab.icon}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
