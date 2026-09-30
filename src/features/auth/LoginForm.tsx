"use client";

/**
 * "Login to your Account" screen.
 *
 *   ←
 *   Login to your
 *   Account              ← large bold title
 *
 *   [✉ Email          ]  ← grey fields, green when focused
 *   [🔒 Password    👁 ]
 *        ☑ Remember me
 *   (      Sign in      ) ← faded until both fields have a value
 *    Forgot the password?  ← green link
 *
 *   ── or continue with ──
 *     [f]   [G]   []
 *
 *   Don't have an account? Sign up
 *
 * Same frame and components as the sign-up screen (<AuthShell>), so the
 * two always stay visually identical.
 */

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon, MailIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { PasswordField, TextField } from "@/components/ui/TextField";
import { ROUTES } from "@/config/routes";
import { signIn } from "./api";
import { AuthFooterLink, AuthShell, FormAlert, authFormClass, authSectionClass } from "./AuthShell";
import { loginSchema, type LoginInput, type LoginValues } from "./schemas";
import { SocialSignIn } from "./SocialSignIn";

export function LoginForm() {
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

  // Only enable "Sign in" once both fields have something in them (as in the design).
  const [email, password] = useWatch({ control, name: ["email", "password"] });
  const canSubmit = Boolean(email && password) && !isSubmitting;

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    const result = await signIn(values);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    // TODO(auth): go to the dashboard once it exists.
  };

  return (
    <AuthShell
      backHref={ROUTES.onboarding}
      title={
        <>
          Login to your
          <br />
          Account
        </>
      }
      footer={
        <>
          Don&apos;t have an account? <AuthFooterLink href={ROUTES.register}>Sign up</AuthFooterLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={authFormClass}>
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

        <FormAlert message={formError} />

        <Button type="submit" size="lg" fullWidth disabled={!canSubmit} className="mt-1">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>

        <Link
          href={ROUTES.forgotPassword}
          className="mx-auto text-base font-semibold text-brand-600 hover:underline lg:text-sm"
        >
          Forgot the password?
        </Link>
      </form>

      <div className={authSectionClass}>
        <SocialSignIn onError={setFormError} />
      </div>
    </AuthShell>
  );
}
