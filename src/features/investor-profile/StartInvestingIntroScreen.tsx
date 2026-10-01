"use client";

/**
 * "Let's build your investment plan": shown ONCE, right after registration
 * (after 2FA is set up or skipped), before the dashboard. Introduces the
 * investor risk profile and package matching. Layout inspired by the
 * "Wallety" welcome mockup.
 *
 *   [F1 Feenicks1]                          Skip
 *
 *   Ama, let's build                        ← dark
 *   your investment plan                    ← green
 *   A few quick questions to match you
 *   with the right packages.
 *
 *        ✦ [ wallet + cedi notes + ↗ ] ✦    ← GrowingWalletIllustration
 *
 *   (          Get started  →           )
 *
 * Kept deliberately minimal (title, one line, picture, one button): users
 * arrive straight from a long sign-up, so nothing should compete with
 * "Get started".
 *
 * Get started → the risk profile questions. Skip → dashboard (where a card
 * invites them to do it later).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark, LogoWordmark } from "@/components/brand/Logo";
import { ArrowRight } from "@/components/icons";
import { stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { GrowingWalletIllustration } from "./GrowingWalletIllustration";

/** Where each button leads. */
const NEXT_SCREEN_GET_STARTED = ROUTES.riskProfileQuestions;
const NEXT_SCREEN_SKIP = ROUTES.dashboard;

export function StartInvestingIntroScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const [isStarting, setIsStarting] = useState(false);

  const firstName = current.status === "signed-in" ? current.account.firstName : null;

  return (
    // Short phones (≤ 700px tall, e.g. 320×640) get a smaller title and picture.
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:justify-center sm:py-10">
      {/* Brand on the left, Skip on the right (as in the mockup). */}
      <header className="flex min-h-11 items-center justify-between">
        <div className="flex items-center gap-2">
          <LogoMark tone="brand" className="h-7" decorative />
          <LogoWordmark tone="brand" className="h-3.5" />
        </div>
        <button
          type="button"
          onClick={() => router.replace(NEXT_SCREEN_SKIP)}
          className="-mr-3 cursor-pointer rounded-full px-3 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-foreground/5 dark:text-neutral-400"
        >
          Skip
        </button>
      </header>

      <div className="flex flex-1 flex-col sm:flex-none">
        <h1 className="mt-[clamp(1.25rem,6dvh,3.5rem)] text-[1.625rem] leading-tight font-bold tracking-tight lg:mt-10 lg:text-2xl [@media(max-height:700px)]:text-[1.375rem]">
          <span className="block">{firstName ? `${firstName}, let's build` : "Let's build"}</span>
          <span className="block text-brand-700 dark:text-brand-400">your investment plan</span>
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-neutral-500 lg:text-sm dark:text-neutral-400 [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:text-sm">
          A few quick questions to match you with the right packages.
        </p>

        {/* The picture fills the free space on phones, centred. Its size
            follows the VISIBLE screen height (dvh), so title, picture and
            button all fit even with the browser's address bar showing. */}
        <div className="my-auto flex justify-center py-[clamp(0.75rem,3dvh,2rem)] sm:my-0 lg:py-8">
          <GrowingWalletIllustration className="h-[min(15rem,30dvh)] w-auto max-w-full" />
        </div>

        {/* Pinned to the bottom: the button is always fully visible on arrival. */}
        <div className={stickyActionsClass}>
          <Button
            size="lg"
            fullWidth
            isLoading={isStarting}
            loadingLabel="Starting"
            onClick={() => {
              setIsStarting(true);
              router.push(NEXT_SCREEN_GET_STARTED);
            }}
          >
            Get started
            <ArrowRight />
          </Button>
        </div>
      </div>
    </main>
  );
}
