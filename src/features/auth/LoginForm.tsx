"use client";

/**
 * "Log in to your Account" screen.
 *
 *   ←
 *   Log in to your
 *   Account              ← large bold title
 *
 *   [✉ Email          ]  ← grey fields, green when focused
 *   [🔒 Password    👁 ]
 *        ☑ Remember me
 *   (      Log in       ) ← faded until both fields have a value
 *    Forgot the password?  ← green link
 *
 *   ── or continue with ──
 *     [f]   [G]   []
 *
 *   Don't have an account? Sign up
 *
 * Same frame and components as the sign-up screen (<AuthScreenLayout>), so the
 * two always stay visually identical.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon, MailIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { PasswordField, TextField } from "@/components/ui/TextField";
import { ROUTES } from "@/config/routes";
import { getRouteForStep } from "./accountProgress";
import { logIn, sendEmailVerificationCode } from "./authService";
import { AuthFooterLink, AuthScreenLayout, authFormSpacing, authSectionSpacing } from "./AuthScreenLayout";
import { loginSchema, type LoginInput, type LoginValues } from "./authValidation";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { useSignUpStore } from "./useSignUpStore";

export function LoginForm() {
  const router = useRouter();
  const saveSignUpEmail = useSignUpStore((s) => s.saveEmail);
  /** Form-level error (e.g. wrong credentials, network failure). */
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember: false },
  });

  // Only enable "Log in" once both fields have something in them (as in the design).
  const [email, password] = useWatch({ control, name: ["email", "password"] });
  const canSubmit = Boolean(email && password);

  // Keeps the spinner going after success until the next screen has loaded.
  const [isRedirecting, setIsRedirecting] = useState(false);

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    const result = await logIn(values);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setIsRedirecting(true);

    // Email never verified: send a fresh code and show the Verify Email screen.
    if (result.nextStep === "verify-email") {
      saveSignUpEmail(result.email);
      void sendEmailVerificationCode(result.email);
    }

    // Continue where they left off: a registration step, or (all done)
    // Enter PIN → dashboard. See accountProgress.ts.
    router.replace(getRouteForStep(result.nextStep));
  };

  return (
    <AuthScreenLayout
      backHref={ROUTES.onboarding}
      title={
        <>
          Log in to your
          <br />
          Account
        </>
      }
      footer={
        <>
          Don&apos;t have an account? <AuthFooterLink href={ROUTES.signUp}>Sign up</AuthFooterLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={authFormSpacing}>
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          // Paired with "current-password" below, lets password managers autofill the saved login.
          autoComplete="email"
          icon={<MailIcon />}
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordField
          label="Password"
          autoComplete="current-password"
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
          loadingLabel="Logging in"
          className="mt-1"
        >
          Log in
        </Button>

        <Link
          href={ROUTES.forgotPassword}
          className="mx-auto text-[0.9375rem] font-semibold text-brand-600 hover:underline lg:text-sm"
        >
          Forgot the password?
        </Link>
      </form>

      <div className={authSectionSpacing}>
        <SocialLoginButtons onError={setFormError} />
      </div>
    </AuthScreenLayout>
  );
}
