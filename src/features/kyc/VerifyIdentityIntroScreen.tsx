"use client";

/**
 * KYC step 2: "Let's Verify Your Identity" (the intro before the ID checks).
 *
 *   ← Let's Verify Your Identity
 *   We need to confirm who you are before you can start investing.
 *   It only takes about 3 minutes.
 *
 *          [ illustration, gently floating ]
 *
 *   🔒 Your data is encrypted and kept secure.
 *   (          Verify Identity          )
 *
 * Explains WHY we need their ID (a legal requirement) and reassures them
 * about security. People are far more willing to share ID documents when
 * they understand why and trust how it's handled.
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockIcon } from "@/components/icons";
import { StepScreenLayout, stepActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";

/** Where "Verify Identity" leads: choosing nationality and ID document. */
const NEXT_SCREEN = ROUTES.kycProofOfResidency;

export function VerifyIdentityIntroScreen() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    router.push(NEXT_SCREEN);
  };

  return (
    <StepScreenLayout title="Let's Verify Your Identity" backHref={ROUTES.kycInvestmentGoals}>
      <div className="flex flex-1 flex-col sm:flex-none">
        <p className="text-[0.9375rem] leading-relaxed text-neutral-600 lg:text-sm dark:text-neutral-400">
          We need to confirm who you are before you can start investing. It only takes about 3
          minutes.
        </p>

        {/* Illustration, centred in the free space and gently floating. */}
        <div className="my-auto flex justify-center py-8 sm:my-0 lg:py-6">
          <Image
            src="/illustrations/verify-identity.png"
            alt="A woman verifying her identity on her phone, with an approved ID card beside her"
            width={1376}
            height={1078}
            preload
            sizes="(min-width: 1024px) 320px, 90vw"
            className="h-auto w-full max-w-xs animate-float motion-reduce:animate-none lg:max-w-[18rem]"
          />
        </div>

        <div className={stepActionsClass}>
          {/* Reassurance right above the button, where hesitation happens. */}
          <p className="mb-4 flex items-center justify-center gap-2 text-sm text-neutral-500 lg:text-[0.8125rem]">
            <LockIcon className="size-4 text-brand-700" />
            Your data is encrypted and kept secure.
          </p>

          <Button
            size="lg"
            fullWidth
            onClick={handleStart}
            isLoading={isStarting}
            loadingLabel="Starting verification"
          >
            Verify Identity
          </Button>
        </div>
      </div>
    </StepScreenLayout>
  );
}
