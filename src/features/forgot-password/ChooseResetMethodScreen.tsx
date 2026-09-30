"use client";

/**
 * Forgot password, STEP 1 of 3: choose how to receive the reset code.
 *
 *   ← Forgot Password
 *
 *   Select which contact details we should use to reset your password
 *   ┌──────────────────────────┐
 *   │ (💬)  via SMS            │     ← selected option gets a green border
 *   │       Text me a code     │
 *   └──────────────────────────┘
 *   ┌──────────────────────────┐
 *   │ (✉)  via Email           │
 *   │       Email me a code    │
 *   └──────────────────────────┘
 *   [ phone number / email    ]      ← field for the chosen option
 *   (         Continue         )
 *
 * Next: /forgot-password/verify-code
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon, MessageIcon, PhoneIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { TextField } from "@/components/ui/TextField";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import {
  StepScreenLayout,
  stepActionsClass,
  stepFormClass,
} from "@/components/layout/StepScreenLayout";
import { requestResetCode } from "./passwordResetService";
import {
  chooseResetMethodSchema,
  type ChooseResetMethodValues,
  type ResetMethod,
} from "./passwordResetValidation";
import { useForgotPasswordStore } from "./useForgotPasswordStore";

/** The two delivery options shown as selectable cards. */
const RESET_OPTIONS: {
  method: ResetMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  { method: "sms", title: "via SMS", description: "Text me a code", icon: <MessageIcon /> },
  { method: "email", title: "via Email", description: "Email me a code", icon: <MailIcon /> },
];

export function ChooseResetMethodScreen() {
  const router = useRouter();
  const saveContactDetails = useForgotPasswordStore((s) => s.saveContactDetails);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<ChooseResetMethodValues>({
    resolver: zodResolver(chooseResetMethodSchema),
    mode: "onTouched",
    defaultValues: { method: "sms", contact: "" },
  });

  const [method, contact] = useWatch({ control, name: ["method", "contact"] });
  const isSms = method === "sms";

  const onSubmit = async (values: ChooseResetMethodValues) => {
    setFormError(null);
    // Emails are case-insensitive; store one consistent form.
    const cleanContact =
      values.method === "email" ? values.contact.toLowerCase() : values.contact;

    const result = await requestResetCode(values.method, cleanContact);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    saveContactDetails(values.method, cleanContact);
    router.push(ROUTES.forgotPasswordVerifyCode);
  };

  return (
    <StepScreenLayout title="Forgot Password" backHref={ROUTES.login}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className={cn(stepFormClass, "gap-7 lg:gap-6")}
      >
        <p className="text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          Select which contact details we should use to reset your password
        </p>

        {/* Radio group styled as cards. The real radio input is visually
            hidden; the card reacts to it with `has-[:checked]`. */}
        <fieldset className="flex flex-col gap-5 lg:gap-4">
          <legend className="sr-only">Send the reset code</legend>
          {RESET_OPTIONS.map((option) => (
            <label
              key={option.method}
              // Flat, sleek card: thin grey hairline border; the selected card's
              // border turns brand green. No shadows or outer rings. Keyboard
              // focus is shown by a darker border instead.
              className="flex cursor-pointer items-center gap-5 rounded-2xl border border-neutral-200 p-6 transition-colors hover:border-neutral-300 has-checked:border-brand-600 has-focus-visible:border-brand-400 lg:gap-4 lg:p-5 dark:border-white/10"
            >
              <input
                type="radio"
                value={option.method}
                className="sr-only"
                {...register("method", {
                  // Switching SMS ⇄ email empties the field and its error.
                  onChange: () => resetField("contact"),
                })}
              />
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 lg:size-13 dark:bg-brand-500/10 [&_svg]:size-7 lg:[&_svg]:size-6">
                {option.icon}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm text-neutral-500">{option.title}</span>
                <span className="text-base font-bold">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {/* Re-keyed by method so the field resets cleanly when switching. */}
        <TextField
          key={method}
          label={isSms ? "Phone number" : "Email"}
          placeholder={isSms ? "Phone number, e.g. +233 24 123 4567" : "Email"}
          type={isSms ? "tel" : "email"}
          inputMode={isSms ? "tel" : "email"}
          autoComplete={isSms ? "tel" : "email"}
          icon={isSms ? <PhoneIcon /> : <MailIcon />}
          error={errors.contact?.message}
          {...register("contact")}
        />

        <FormErrorMessage message={formError} />

        <div className={stepActionsClass}>
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!contact}
            isLoading={isSubmitting}
            loadingLabel="Sending code"
          >
            Continue
          </Button>
        </div>
      </form>
    </StepScreenLayout>
  );
}
