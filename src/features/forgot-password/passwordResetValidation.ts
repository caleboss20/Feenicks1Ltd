import { z } from "zod";
import { passwordSchema } from "@/features/auth/authValidation";

/**
 * Validation rules for the forgot-password flow (zod).
 * The new password reuses the same `passwordSchema` as sign-up, so the
 * password policy is identical everywhere.
 */

export const resetMethodSchema = z.enum(["sms", "email"]);
/** How the reset code is delivered: by text message or by email. */
export type ResetMethod = z.infer<typeof resetMethodSchema>;

/** Digits, spaces, dashes, brackets and an optional leading "+". */
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;

/* ── Step 1: choose SMS or email, and enter that contact detail ────────── */
export const chooseResetMethodSchema = z
  .object({
    method: resetMethodSchema,
    contact: z.string().trim(),
  })
  .superRefine(({ method, contact }, ctx) => {
    if (method === "email" && !z.email().safeParse(contact).success) {
      ctx.addIssue({ code: "custom", path: ["contact"], message: "Enter a valid email address" });
    }
    const digitCount = contact.replace(/\D/g, "").length;
    if (method === "sms" && (!PHONE_PATTERN.test(contact) || digitCount < 7 || digitCount > 15)) {
      ctx.addIssue({
        code: "custom",
        path: ["contact"],
        message: "Enter a valid phone number, including the country code",
      });
    }
  });

export type ChooseResetMethodValues = z.infer<typeof chooseResetMethodSchema>;

/* ── Step 3: the new password, typed twice ─────────────────────────────── */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
    remember: z.boolean(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
