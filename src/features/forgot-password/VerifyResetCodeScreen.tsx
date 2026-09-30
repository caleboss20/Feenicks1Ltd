"use client";

/**
 * Forgot password, STEP 2 of 3: enter the code that was sent.
 *
 *   ← Forgot Password
 *      Code has been sent to +233 *******67
 *      [ 4 ] [ 7 ] [   ] [   ]
 *         Resend code in 55 s
 *   (          Verify          )
 *
 * The form itself is the shared <CodeVerificationForm>; this screen only
 * decides what happens with the code.
 * Requires step 1's data; without it (e.g. after a page refresh) the user
 * is sent back to step 1.
 * Next: /forgot-password/new-password
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CodeVerificationForm } from "@/components/forms/CodeVerificationForm";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ROUTES } from "@/config/routes";
import { maskEmail, maskPhone } from "@/lib/maskContactDetails";
import { requestResetCode, verifyResetCode } from "./passwordResetService";
import { useForgotPasswordStore } from "./useForgotPasswordStore";

export function VerifyResetCodeScreen() {
  const router = useRouter();
  const method = useForgotPasswordStore((s) => s.method);
  const contact = useForgotPasswordStore((s) => s.contact);
  const saveResetToken = useForgotPasswordStore((s) => s.saveResetToken);

  // No contact details = step 1 was skipped or the page was refreshed → start over.
  useEffect(() => {
    if (!method || !contact) router.replace(ROUTES.forgotPassword);
  }, [method, contact, router]);

  if (!method || !contact) return null;

  return (
    <StepScreenLayout title="Forgot Password" backHref={ROUTES.forgotPassword}>
      <CodeVerificationForm
        sentTo={method === "sms" ? maskPhone(contact) : maskEmail(contact)}
        onVerify={async (code) => {
          const result = await verifyResetCode(contact, code);
          if (!result.ok) return result.message;
          saveResetToken(result.data.resetToken);
          router.push(ROUTES.forgotPasswordNewPassword);
          return null;
        }}
        onResend={async () => {
          const result = await requestResetCode(method, contact);
          return result.ok ? null : result.message;
        }}
      />
    </StepScreenLayout>
  );
}
