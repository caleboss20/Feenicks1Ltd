"use client";

/**
 * Authenticator-app 2FA setup, STEP 2: "Confirmation code" (as in the mockup).
 *
 *   ←          Confirmation code           ◌   ← ring: time until the app's next code
 *   Once your authenticator app shows a code for
 *   Feenicks1, enter it below:
 *
 *   Enter the confirmation code
 *   [ 244 642              (Confirm) ]          ← <OneTimeCodeForm>, no "Resend"
 *
 * The code is really checked (TOTP, lib/totp.ts): it must match what the
 * app shows right now. Correct → "2FA Enabled" (tap anywhere) → start-investing intro.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OneTimeCodeForm } from "@/components/forms/OneTimeCodeForm";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ROUTES } from "@/config/routes";
import { FIRST_SCREEN_AFTER_REGISTRATION } from "@/features/auth/accountProgress";
import { CodeRefreshRing } from "./CodeRefreshRing";
import { confirmAuthenticatorSetup } from "./securityService";
import { TwoFactorEnabledScreen } from "./TwoFactorEnabledScreen";
import { useAuthenticatorSetupStore } from "./useAuthenticatorSetupStore";

/** Where "Tap anywhere to continue" leads: registration is finished, so the start-investing intro. */
const NEXT_SCREEN = FIRST_SCREEN_AFTER_REGISTRATION;

export function ConfirmAuthenticatorCodeScreen() {
  const router = useRouter();
  const setup = useAuthenticatorSetupStore((s) => s.setup);
  const clearSetup = useAuthenticatorSetupStore((s) => s.clear);
  const [isEnabled, setIsEnabled] = useState(false);

  // No QR code scanned yet (e.g. after a refresh) → back to the QR screen.
  const isMissingSetup = !setup && !isEnabled;
  useEffect(() => {
    if (isMissingSetup) router.replace(ROUTES.twoFactorAuthenticator);
  }, [isMissingSetup, router]);

  const goToNextScreen = useCallback(() => router.replace(NEXT_SCREEN), [router]);

  if (isMissingSetup) return null;

  return (
    <StepScreenLayout
      title="Confirmation code"
      centeredTitle
      backHref={ROUTES.twoFactorAuthenticator}
      headerAction={<CodeRefreshRing />}
    >
      <p className="text-[0.9375rem] leading-relaxed text-neutral-600 lg:text-sm dark:text-neutral-400">
        Once your authenticator app shows a code for Feenicks1, enter it below:
      </p>

      <OneTimeCodeForm
        className="mt-10 lg:mt-8"
        onConfirm={async (code) => {
          if (!setup) return "Please scan the QR code first.";
          const result = await confirmAuthenticatorSetup(setup.secret, code);
          if (!result.ok) return result.message;
          setIsEnabled(true);
          clearSetup(); // the secret is no longer needed in memory
          return null;
        }}
      />

      {/* Retries leave several "Feenicks1" entries in the app; only the newest matches. */}
      <p className="mt-6 text-[0.8125rem] leading-relaxed text-neutral-500">
        Set it up before? Use the <span className="font-semibold">newest</span> Feenicks1
        entry in your app, and delete any older ones.
      </p>

      {isEnabled && (
        <TwoFactorEnabledScreen
          message="We'll ask for a code from your authenticator app anytime you log in on a new device or withdraw funds."
          onContinue={goToNextScreen}
        />
      )}
    </StepScreenLayout>
  );
}
