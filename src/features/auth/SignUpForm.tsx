"use client";

/**
 * "Create your Account" screen.
 *
 *   ←
 *   Create your
 *   Account              ← large bold title
 *
 *   (🎁 Invited by a friend · F1ABC123)   ← only with ?ref= (invite link / QR)
 *   [✉ Email          ]  ← grey fields, green when focused
 *   [🔒 Password    👁 ]
 *        ☑ Remember me
 *   (      Sign up      ) ← faded until both fields have a value
 *
 *   ── or continue with ──
 *     [f]   [G]   []
 *
 *   Already have an account? Log in
 *
 * Layout comes from <AuthScreenLayout> (shared with the login screen).
 * Form state and validation: react-hook-form + zod (`signUpSchema`).
 * Errors appear after the user leaves a field (onTouched), not while
 * they're still typing their first attempt.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GiftIcon, LockIcon, MailIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { PasswordField, TextField } from "@/components/ui/TextField";
import { COMPANY } from "@/config/company";
import { ROUTES } from "@/config/routes";
import { signUp } from "./authService";
import { AuthFooterLink, AuthScreenLayout, authFormSpacing, authSectionSpacing } from "./AuthScreenLayout";
import { signUpSchema, type SignUpInput, type SignUpValues } from "./authValidation";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { useSignUpStore } from "./useSignUpStore";

type SignUpFormProps = {
  /** The friend's code when the user came from an invite link or QR code (`?ref=`). */
  referralCode?: string | null;
};

export function SignUpForm({ referralCode }: SignUpFormProps) {
  const router = useRouter();
  const saveEmail = useSignUpStore((s) => s.saveEmail);
  /** Form-level error (e.g. server/network failure), shown above the button. */
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput, unknown, SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember: false },
  });

  // Only enable "Sign up" once both fields have something in them (as in the design).
  const [email, password] = useWatch({ control, name: ["email", "password"] });
  const canSubmit = Boolean(email && password);

  // Keeps the spinner going after success until the next screen has loaded
  // (react-hook-form's `isSubmitting` turns off as soon as onSubmit returns).
  const [isRedirecting, setIsRedirecting] = useState(false);

  const onSubmit = async (values: SignUpValues) => {
    setFormError(null);
    const result = await signUp(values, { referralCode });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    // Next: enter the code emailed to the new account.
    setIsRedirecting(true);
    saveEmail(values.email);
    router.push(ROUTES.verifyEmail);
  };

  return (
    <AuthScreenLayout
      backHref={ROUTES.onboarding}
      title={
        <>
          Create your
          <br />
          Account
        </>
      }
      footer={
        <>
          Already have an account? <AuthFooterLink href={ROUTES.login}>Log in</AuthFooterLink>
        </>
      }
    >
      {/* noValidate: we show our own consistent error messages instead of
          the browser's built-in validation bubbles. */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={authFormSpacing}>
        {referralCode && (
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3.5 py-2 text-[0.8125rem] font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
            <GiftIcon className="size-4" />
            Invited by a friend · {referralCode}
          </p>
        )}

        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          icon={<MailIcon />}
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordField
          label="Password"
          // Tells password managers to suggest a strong new password.
          autoComplete="new-password"
          icon={<LockIcon />}
          error={errors.password?.message}
          {...register("password")}
        />

        <Checkbox label="Remember me" className="mx-auto mt-1" {...register("remember")} />

        <FormErrorMessage message={formError} />

        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          isLoading={isSubmitting || isRedirecting}
          loadingLabel="Creating your account"
          className="mt-1"
        >
          Sign up
        </Button>

        {/* What signing up means, and who it's with (the trust line). */}
        <p className="text-center text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          By signing up, you agree to our{" "}
          <Link href={`${ROUTES.legal}/terms`} className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href={`${ROUTES.legal}/privacy`} className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Privacy Policy
          </Link>
          .
          <span className="mt-1 block text-neutral-400 dark:text-neutral-500">
            {COMPANY.legalName} · Reg. No. {COMPANY.registrationNumber} · {COMPANY.address}
          </span>
        </p>
      </form>

      <div className={authSectionSpacing}>
        <SocialLoginButtons onError={setFormError} />
      </div>
    </AuthScreenLayout>
  );
}
