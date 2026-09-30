"use client";

/**
 * Forgot password, STEP 2 of 3: enter the code that was sent.
 *
 *   ← Forgot Password
 *
 *      Code has been sent to +234 ********78      ← masked for privacy
 *
 *      [ 4 ] [ 7 ] [   ] [   ]                    ← VerificationCodeInput
 *
 *         Resend code in 55 s                      ← countdown, then a link
 *
 *   (          Verify          )
 *
 * Requires step 1's data; without it (e.g. after a page refresh) the user
 * is sent back to step 1.
 * Next: /forgot-password/new-password
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import {
  VerificationCodeInput,
  isCodeComplete,
} from "@/components/ui/VerificationCodeInput";
import { ROUTES } from "@/config/routes";
import { maskEmail, maskPhone } from "@/lib/maskContactDetails";
import {
  ForgotPasswordScreenLayout,
  stepActionsClass,
  stepFormClass,
} from "./ForgotPasswordScreenLayout";
import { requestResetCode, verifyResetCode } from "./passwordResetService";
import { RESEND_CODE_AFTER_SECONDS, RESET_CODE_LENGTH } from "./passwordResetValidation";
import { useForgotPasswordStore } from "./useForgotPasswordStore";

export function VerifyResetCodeScreen() {
  const router = useRouter();
  const method = useForgotPasswordStore((s) => s.method);
  const contact = useForgotPasswordStore((s) => s.contact);
  const saveResetToken = useForgotPasswordStore((s) => s.saveResetToken);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_CODE_AFTER_SECONDS);

  // No contact details = step 1 was skipped or the page was refreshed → start over.
  useEffect(() => {
    if (!method || !contact) router.replace(ROUTES.forgotPassword);
  }, [method, contact, router]);

  // Resend countdown: ticks once per second until it reaches 0.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  if (!method || !contact) return null;

  const maskedContact = method === "sms" ? maskPhone(contact) : maskEmail(contact);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isCodeComplete(code, RESET_CODE_LENGTH)) return;

    setError(null);
    setIsVerifying(true);
    const result = await verifyResetCode(contact, code);
    setIsVerifying(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    saveResetToken(result.data.resetToken);
    router.push(ROUTES.forgotPasswordNewPassword);
  };

  const handleResend = async () => {
    setError(null);
    setCode("");
    setSecondsLeft(RESEND_CODE_AFTER_SECONDS);
    const result = await requestResetCode(method, contact);
    if (!result.ok) setError(result.message);
  };

  return (
    <ForgotPasswordScreenLayout title="Forgot Password" backHref={ROUTES.forgotPassword}>
      <form onSubmit={handleVerify} noValidate className={stepFormClass}>
        {/* Vertically centred in the free space on phones, as in the design. */}
        <div className="my-auto flex flex-col gap-10 py-6 sm:my-0 lg:gap-8">
          <p className="text-center text-base lg:text-sm">
            Code has been sent to <span className="font-semibold">{maskedContact}</span>
          </p>

          <VerificationCodeInput
            length={RESET_CODE_LENGTH}
            value={code}
            onChange={(value) => {
              setCode(value);
              setError(null);
            }}
            hasError={Boolean(error)}
            autoFocus
          />

          {/* aria-live: screen readers hear when "Resend code" becomes available. */}
          <p aria-live="polite" className="text-center text-base lg:text-sm">
            {secondsLeft > 0 ? (
              <>
                Resend code in{" "}
                <span className="font-semibold text-brand-600 tabular-nums">{secondsLeft}</span> s
              </>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="cursor-pointer font-semibold text-brand-600 hover:underline"
              >
                Resend code
              </button>
            )}
          </p>

          <FormErrorMessage message={error} />
        </div>

        <div className={stepActionsClass}>
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!isCodeComplete(code, RESET_CODE_LENGTH) || isVerifying}
          >
            {isVerifying ? "Verifying…" : "Verify"}
          </Button>
        </div>
      </form>
    </ForgotPasswordScreenLayout>
  );
}
