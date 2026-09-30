import { z } from "zod";

/**
 * Validation rules for the auth forms (zod).
 *
 * One schema serves two purposes:
 *   1. instant, friendly errors in the browser (via react-hook-form)
 *   2. the same rules re-checked on the server before anything is saved.
 *      Never trust the browser alone.
 *
 * `RegisterValues` is inferred from the schema, so the form's TypeScript
 * types can never drift from the validation rules.
 */

/** Password policy: kept in one place so sign-up and reset-password match. */
export const PASSWORD_MIN_LENGTH = 8;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/\d/, "Password must include a number");

/** Email: trimmed and lower-cased before validation, so " Ann@X.com " works. */
const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  remember: z.boolean(),
});

/**
 * Login only checks the password isn't empty. The strength rules apply
 * when a password is created, and repeating them here would only leak
 * hints about the policy to someone guessing.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;

/** What the form fields hold (before trimming/lower-casing). */
export type RegisterInput = z.input<typeof registerSchema>;
/** What you get after validation: clean data, safe to send to the API. */
export type RegisterValues = z.output<typeof registerSchema>;
