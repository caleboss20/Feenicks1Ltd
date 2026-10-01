"use client";

/**
 * SMS two-factor setup: "Confirmation code". Reached from the 2FA screen
 * after choosing "SMS code" (the code has already been sent).
 *
 *   ← Confirmation code
 *   We've sent a 6-digit code to +233 *******67. Enter it below to
 *   turn on two-factor authentication.
 *
 *   Enter the confirmation code
 *   [ 244 642              (Confirm) ]   ← <OneTimeCodeForm>
 *   Didn't get it? Resend code in 42 s
 *
 * Correct code → "2FA Enabled" (tap anywhere) → start-investing intro.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { OneTimeCodeForm } from "@/components/forms/OneTimeCodeForm";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ROUTES } from "@/config/routes";
import { FIRST_SCREEN_AFTER_REGISTRATION } from "@/features/auth/accountProgress";
import { TWO_FACTOR_CODE_LENGTH } from "@/config/verification";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { maskGhanaPhone } from "@/lib/maskContactDetails";
import { confirmTwoFactorSmsCode, sendTwoFactorSetupCode } from "./securityService";
import { TwoFactorEnabledScreen } from "./TwoFactorEnabledScreen";

/** Where "Tap anywhere to continue" leads: registration is finished, so the start-investing intro. */
const NEXT_SCREEN = FIRST_SCREEN_AFTER_REGISTRATION;

export function ConfirmSmsCodeScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const [isEnabled, setIsEnabled] = useState(false);

  const goToNextScreen = useCallback(() => router.replace(NEXT_SCREEN), [router]);

  // Always signed in here (the /security layout checks); this just narrows the type.
  if (current.status !== "signed-in") return null;

  return (
    <StepScreenLayout title="Confirmation code" backHref={ROUTES.twoFactor}>
      <p className="text-[0.9375rem] leading-relaxed text-neutral-500 lg:text-sm dark:text-neutral-400">
        We&apos;ve sent a {TWO_FACTOR_CODE_LENGTH}-digit code to{" "}
        <span className="font-semibold whitespace-nowrap text-neutral-700 dark:text-neutral-200">
          {maskGhanaPhone(current.account.phone)}
        </span>
        . Enter it below to turn on two-factor authentication.
      </p>

      <OneTimeCodeForm
        className="mt-10 lg:mt-8"
        onConfirm={async (code) => {
          const result = await confirmTwoFactorSmsCode(code);
          if (!result.ok) return result.message;
          setIsEnabled(true);
          return null;
        }}
        onResend={async () => {
          const result = await sendTwoFactorSetupCode();
          return result.ok ? null : result.message;
        }}
      />

      {isEnabled && (
        <TwoFactorEnabledScreen
          message="We'll ask for a code sent to your phone anytime you log in on a new device or withdraw funds."
          onContinue={goToNextScreen}
        />
      )}
    </StepScreenLayout>
  );
}
