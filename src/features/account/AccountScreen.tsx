"use client";

/**
 * Account tab: who's logged in, and everything about their account.
 *
 *   Account
 *   (📷) Ama Mensah
 *        ama@example.com
 *
 *   Investor profile        Moderate   ›
 *   Investment packages                ›
 *   Reset PIN                          ›
 *   Support                            ↗
 *   ─────────────────────────────────────
 *   ⇥ Log out                              ← red
 *
 * TODO(settings): change password, 2FA, fingerprint, dark mode toggle.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  CompassIcon,
  GridIcon,
  KeyIcon,
  LogoutIcon,
  SupportIcon,
} from "@/components/icons";
import { AppTabScreenLayout } from "@/components/layout/AppTabScreenLayout";
import { ROUTES } from "@/config/routes";
import { logOut } from "@/features/auth/authService";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { RISK_LEVELS } from "@/features/investor-profile/riskProfileQuestions";

/** Company website, for "Support" until in-app support exists. */
const SUPPORT_URL = "https://www.feenicks1solutions.com";

export function AccountScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Always signed in here (AppLockGuard); this just narrows the type.
  if (current.status !== "signed-in") return null;
  const { email, firstName, avatarUrl, riskLevel } = current.account;

  const handleLogOut = async () => {
    setIsLoggingOut(true);
    await logOut();
    router.replace(ROUTES.login);
  };

  const rows = [
    {
      label: "Investor profile",
      value: riskLevel ? RISK_LEVELS[riskLevel].name : "Not set",
      href: riskLevel ? ROUTES.riskProfileResult : ROUTES.riskProfileQuestions,
      icon: <CompassIcon />,
    },
    { label: "Investment packages", href: ROUTES.packages, icon: <GridIcon /> },
    { label: "Reset PIN", href: ROUTES.forgotPin, icon: <KeyIcon /> },
    { label: "Support", href: SUPPORT_URL, icon: <SupportIcon />, external: true },
  ];

  return (
    <AppTabScreenLayout title="Account">
      {/* Who's logged in */}
      <section className="flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={64}
            height={64}
            unoptimized // a small local thumbnail: nothing to optimise
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
          >
            {(firstName ?? "F1").slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{firstName ?? "Your account"}</p>
          <p className="truncate text-sm text-neutral-500">{email}</p>
        </div>
      </section>

      {/* Settings rows */}
      <ul className="divide-y divide-neutral-100 rounded-3xl border border-neutral-100 dark:divide-white/10 dark:border-white/10">
        {rows.map((row) => (
          <li key={row.label}>
            <Link
              href={row.href}
              {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300 [&_svg]:size-[18px]">
                {row.icon}
              </span>
              <span className="flex-1 text-sm font-medium">{row.label}</span>
              {row.value && <span className="text-sm text-neutral-500">{row.value}</span>}
              {/* Chevron turned to point right ("open"). */}
              <ChevronDownIcon className="size-4 -rotate-90 text-neutral-400" />
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleLogOut}
        disabled={isLoggingOut}
        className="flex cursor-pointer items-center gap-3.5 rounded-3xl border border-neutral-100 px-4 py-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-white/10 dark:hover:bg-red-500/10"
      >
        <span className="grid size-9 place-items-center rounded-full bg-red-50 dark:bg-red-500/10">
          <LogoutIcon className="size-[18px]" />
        </span>
        {isLoggingOut ? "Logging out…" : "Log out"}
      </button>
    </AppTabScreenLayout>
  );
}
