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
 *   Already have an account? Sign in
 *
 * Layout comes from <AuthShell> (shared with the login screen).
 * Form state and validation: react-hook-form + zod (`registerSchema`).
 * Errors appear after the user leaves a field (onTouched), not while
 * they're still typing their first attempt.
 */

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon, MailIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { PasswordField, TextField } from "@/components/ui/TextField";
import { ROUTES } from "@/config/routes";
import { signUp } from "./api";
import { AuthFooterLink, AuthShell, FormAlert, authFormClass, authSectionClass } from "./AuthShell";
import { registerSchema, type RegisterInput, type RegisterValues } from "./schemas";
import { SocialSignIn } from "./SocialSignIn";

export function RegisterForm() {
  /** Form-level error (e.g. server/network failure), shown above the button. */
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember: false },
  });

  // Only enable "Sign up" once both fields have something in them (as in the design).
  const [email, password] = useWatch({ control, name: ["email", "password"] });
  const canSubmit = Boolean(email && password) && !isSubmitting;

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    const result = await signUp(values);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    // TODO(auth): go to the next step of sign-up (e.g. verify email / fill profile).
  };

  return (
    <AuthShell
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
          Already have an account? <AuthFooterLink href={ROUTES.login}>Sign in</AuthFooterLink>
        </>
      }
    >
      {/* noValidate: we show our own consistent error messages instead of
          the browser's built-in validation bubbles. */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={authFormClass}>
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

        <FormAlert message={formError} />

        <Button type="submit" size="lg" fullWidth disabled={!canSubmit} className="mt-1">
          {isSubmitting ? "Signing up…" : "Sign up"}
        </Button>
      </form>

      <div className={authSectionClass}>
        <SocialSignIn onError={setFormError} />
      </div>
    </AuthShell>
  );
}
