"use client";

/**
 * "Create your Account" screen.
 *
 *   ←
 *   Create your
 *   Account              ← large bold title
 *
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
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon, MailIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { PasswordField, TextField } from "@/components/ui/TextField";
import { ROUTES } from "@/config/routes";
import { signUp } from "./authService";
import { AuthFooterLink, AuthScreenLayout, authFormSpacing, authSectionSpacing } from "./AuthScreenLayout";
import { signUpSchema, type SignUpInput, type SignUpValues } from "./authValidation";
import { SocialLoginButtons } from "./SocialLoginButtons";

export function SignUpForm() {
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
  const canSubmit = Boolean(email && password) && !isSubmitting;

  const onSubmit = async (values: SignUpValues) => {
    setFormError(null);
    const result = await signUp(values);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    // TODO(auth): go to the next step of sign-up (e.g. verify email / fill profile).
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

        <Button type="submit" size="lg" fullWidth disabled={!canSubmit} className="mt-1">
          {isSubmitting ? "Signing up…" : "Sign up"}
        </Button>
      </form>

      <div className={authSectionSpacing}>
        <SocialLoginButtons onError={setFormError} />
      </div>
    </AuthScreenLayout>
  );
}
