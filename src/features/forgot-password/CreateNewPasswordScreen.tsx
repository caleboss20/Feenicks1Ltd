"use client";

/**
 * Forgot password, STEP 3 of 3: choose a new password.
 *
 *   ← Create New Password
 *
 *   Choose a strong password…         ← reassuring text; content is vertically centred on phones
 *   [🔒 New password       👁 ]
 *   [🔒 Confirm password   👁 ]
 *   ✓ At least 8 characters           ← live checklist, ticks green as you type
 *   ✓ Includes a letter
 *   ○ Includes a number
 *   ○ Passwords match
 *   ☑ Remember me
 *   (         Continue         )
 *
 * On success: the "Congratulations!" popup appears, then the user is sent
 * to the login page and the reset details are cleared from memory.
 * Requires the reset token from step 2; without it → back to step 1.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { PasswordRequirements } from "@/components/ui/PasswordRequirements";
import { PasswordField } from "@/components/ui/TextField";
import { ROUTES } from "@/config/routes";
import { PASSWORD_RULES } from "@/features/auth/authValidation";
import {
  ForgotPasswordScreenLayout,
  stepActionsClass,
  stepFormClass,
} from "./ForgotPasswordScreenLayout";
import { PasswordResetSuccessDialog } from "./PasswordResetSuccessDialog";
import { saveNewPassword } from "./passwordResetService";
import { newPasswordSchema, type NewPasswordValues } from "./passwordResetValidation";
import { useForgotPasswordStore } from "./useForgotPasswordStore";

export function CreateNewPasswordScreen() {
  const router = useRouter();
  const resetToken = useForgotPasswordStore((s) => s.resetToken);
  const clearResetDetails = useForgotPasswordStore((s) => s.clear);

  const [formError, setFormError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "", remember: false },
  });

  const [password, confirmPassword] = useWatch({
    control,
    name: ["password", "confirmPassword"],
  });

  // No reset token = the code wasn't verified (or the page was refreshed) → start over.
  // Skipped once complete, because the token is cleared on the way out.
  useEffect(() => {
    if (!resetToken && !isComplete) router.replace(ROUTES.forgotPassword);
  }, [resetToken, isComplete, router]);

  // Stable function, so the popup's timer isn't restarted on every render.
  const goToLogin = useCallback(() => {
    router.replace(ROUTES.login);
    clearResetDetails();
  }, [router, clearResetDetails]);

  if (!resetToken && !isComplete) return null;

  const onSubmit = async (values: NewPasswordValues) => {
    if (!resetToken) return;
    setFormError(null);
    const result = await saveNewPassword(resetToken, values.password);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setIsComplete(true);
  };

  return (
    <ForgotPasswordScreenLayout title="Create New Password" backHref={ROUTES.forgotPassword}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={stepFormClass}>
        {/* Centred vertically in the free space on phones, so the screen
            feels calm and balanced rather than crammed at the top. */}
        <div className="my-auto flex flex-col gap-8 py-8 sm:my-0 sm:py-0 lg:gap-5">
          {/* The header already says "Create New Password", so no second title here. */}
          <p className="text-lg leading-relaxed text-neutral-600 lg:text-base dark:text-neutral-400">
            Choose a strong password you haven&apos;t used before. You&apos;ll use it to log in to
            your Feenicks1 account.
          </p>

          <div className="flex flex-col gap-5 lg:gap-4">
            <PasswordField
              label="New password"
              autoComplete="new-password"
              icon={<LockIcon />}
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              icon={<LockIcon />}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          {/* Live checklist, built from the same rules the validation uses. */}
          <PasswordRequirements
            items={[
              ...PASSWORD_RULES.map((rule) => ({
                label: rule.label,
                isMet: rule.isMet(password),
              })),
              {
                label: "Passwords match",
                isMet: Boolean(password) && password === confirmPassword,
              },
            ]}
          />

          <Checkbox label="Remember me" {...register("remember")} />

          <FormErrorMessage message={formError} />
        </div>

        <div className={stepActionsClass}>
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!password || !confirmPassword || isSubmitting || isComplete}
          >
            {isSubmitting ? "Saving…" : "Continue"}
          </Button>
        </div>
      </form>

      <PasswordResetSuccessDialog open={isComplete} onFinished={goToLogin} />
    </ForgotPasswordScreenLayout>
  );
}
