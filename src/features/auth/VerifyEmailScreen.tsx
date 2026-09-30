"use client";

/**
 * "Verify Email" screen, shown right after sign-up.
 *
 *   ← Verify Email
 *      Code has been sent to and***ley@gmail.com
 *      [ 4 ] [ 7 ] [   ] [   ]
 *         Resend code in 55 s
 *   (          Verify          )
 *
 * On success: a "Congratulations!" popup, then the next screen.
 * The form itself is the shared <CodeVerificationForm>.
 * Requires the email from sign-up; without it (e.g. after a page refresh)
 * the user is sent back to sign up.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeVerificationForm } from "@/components/forms/CodeVerificationForm";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { SuccessDialog } from "@/components/ui/SuccessDialog";
import { ROUTES } from "@/config/routes";
import { maskEmail } from "@/lib/maskContactDetails";
import { sendEmailVerificationCode, verifyEmailCode } from "./authService";
import { useSignUpStore } from "./useSignUpStore";

/**
 * Where the user goes once their email is verified: Log in. After logging
 * in, they're sent on to identity verification (see getRouteAfterLogin).
 */
const NEXT_SCREEN_AFTER_VERIFICATION = ROUTES.login;

export function VerifyEmailScreen() {
  const router = useRouter();
  const email = useSignUpStore((s) => s.email);
  const clearSignUp = useSignUpStore((s) => s.clear);
  const [isVerified, setIsVerified] = useState(false);

  // No email = sign-up was skipped or the page was refreshed → back to sign up.
  // Skipped once verified, because the email is cleared on the way out.
  useEffect(() => {
    if (!email && !isVerified) router.replace(ROUTES.signUp);
  }, [email, isVerified, router]);

  // Stable function, so the popup's timer isn't restarted on every render.
  const goToNextScreen = useCallback(() => {
    router.replace(NEXT_SCREEN_AFTER_VERIFICATION);
    clearSignUp();
  }, [router, clearSignUp]);

  if (!email && !isVerified) return null;

  return (
    <StepScreenLayout title="Verify Email" backHref={ROUTES.signUp}>
      <CodeVerificationForm
        sentTo={maskEmail(email)}
        onVerify={async (code) => {
          const result = await verifyEmailCode(email, code);
          if (!result.ok) return result.message;
          setIsVerified(true);
          return null;
        }}
        onResend={async () => {
          const result = await sendEmailVerificationCode(email);
          return result.ok ? null : result.message;
        }}
      />

      <SuccessDialog
        open={isVerified}
        // Acknowledge this step only. The account isn't "ready" until
        // profile and identity checks are done, so lead the user onward.
        title="Email verified"
        message="Great start! Log in to continue your registration and verify your identity, so you can start investing securely."
        spinnerLabel="Taking you to log in"
        onFinished={goToNextScreen}
      />
    </StepScreenLayout>
  );
}
