"use client";

/**
 * Dashboard (PLACEHOLDER): where fully registered users land after the PIN.
 *
 *   Good morning,            [Log out]
 *   Kwame 👋
 *   ┌────────────────────────────┐
 *   │ Portfolio value            │   ← brand-green card
 *   │ GH₵ 0.00                   │
 *   └────────────────────────────┘
 *   Your dashboard is on its way…
 *
 * TODO(dashboard): replace with the real dashboard (portfolio, plans,
 * deposits, withdrawals). Keep the access check below.
 *
 * Access and auto-lock are handled by the (app) layout (AppLockGuard), so
 * this screen can assume a logged-in, registered, unlocked user.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { logOut } from "@/features/auth/authService";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";

/** "Good morning" / "Good afternoon" / "Good evening" by the user's clock. */
function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogOut = async () => {
    setIsLoggingOut(true);
    await logOut();
    router.replace(ROUTES.login);
  };

  // Always signed in here (AppLockGuard); this just narrows the type.
  if (current.status !== "signed-in") return null;

  const { firstName } = current.account;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:max-w-2xl lg:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{greetingForNow()},</p>
          <h1 className="mt-0.5 text-[1.625rem] leading-tight font-bold lg:text-2xl">
            {firstName ?? "Welcome"} 👋
          </h1>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogOut}
          isLoading={isLoggingOut}
          loadingLabel="Logging out"
          className="-mr-3 text-neutral-600 dark:text-neutral-400"
        >
          Log out
        </Button>
      </header>

      {/* Portfolio card */}
      <section className="mt-6 rounded-3xl bg-brand-600 p-6 text-white">
        <p className="text-sm text-white/80">Portfolio value</p>
        <p className="mt-1 text-[2rem] leading-tight font-bold tracking-tight">GH₵ 0.00</p>
        <p className="mt-3 text-[0.8125rem] text-white/80">
          Start investing to watch your money grow.
        </p>
      </section>

      {/* Honest placeholder until the real dashboard is built. */}
      <p className="mt-5 flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm leading-relaxed text-brand-900 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
        <ClockIcon className="mt-0.5 size-5 text-brand-600" />
        <span>
          Your account is all set up. Investment plans, deposits and withdrawals are coming
          to this screen soon.
        </span>
      </p>
    </main>
  );
}
