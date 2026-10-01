"use client";

/**
 * Forgot PIN, STEP 2 of 3: "Confirmation code".
 *
 *   ← Confirmation code
 *   We've sent a 6-digit code to +233 *******67. Enter it below to
 *   reset your PIN.
 *
 *   Enter the confirmation code
 *   [ 244 642              (Confirm) ]   ← <OneTimeCodeForm>, same as SMS 2FA
 *   Didn't get it? Resend code in 42 s
 *
 * Correct code → the server returns a one-time reset token (kept in memory,
 * usePinResetStore) → /security/forgot-pin/new-pin.
 */

import { useRouter } from "next/navigation";
import { OneTimeCodeForm } from "@/components/forms/OneTimeCodeForm";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ROUTES } from "@/config/routes";
import { TWO_FACTOR_CODE_LENGTH } from "@/config/verification";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { maskGhanaPhone } from "@/lib/maskContactDetails";
import { requestPinResetCode, verifyPinResetCode } from "./securityService";
import { usePinResetStore } from "./usePinResetStore";

/** Where a correct code leads. */
const NEXT_SCREEN = ROUTES.forgotPinNewPin;

export function VerifyPinResetCodeScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const saveResetToken = usePinResetStore((s) => s.saveResetToken);

  // Always signed in here (the /security layout checks); this just narrows the type.
  if (current.status !== "signed-in") return null;

  return (
    <StepScreenLayout title="Confirmation code" backHref={ROUTES.forgotPin}>
      <p className="text-[0.9375rem] leading-relaxed text-neutral-500 lg:text-sm dark:text-neutral-400">
        We&apos;ve sent a {TWO_FACTOR_CODE_LENGTH}-digit code to{" "}
        <span className="font-semibold whitespace-nowrap text-neutral-700 dark:text-neutral-200">
          {maskGhanaPhone(current.account.phone)}
        </span>
        . Enter it below to reset your PIN.
      </p>

      <OneTimeCodeForm
        className="mt-10 lg:mt-8"
        onConfirm={async (code) => {
          const result = await verifyPinResetCode(code);
          if (!result.ok) return result.message;
          saveResetToken(result.resetToken);
          // replace: Back from the new-PIN screen shouldn't land on a used code.
          router.replace(NEXT_SCREEN);
          return null;
        }}
        onResend={async () => {
          const result = await requestPinResetCode();
          return result.ok ? null : result.message;
        }}
      />
    </StepScreenLayout>
  );
}
