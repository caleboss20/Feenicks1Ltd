import { z } from "zod";

/**
 * Validation rules for the auth forms (zod).
 *
 * One schema serves two purposes:
 *   1. instant, friendly errors in the browser (via react-hook-form)
 *   2. the same rules re-checked on the server before anything is saved.
 *      Never trust the browser alone.
 *
 * `SignUpValues` is inferred from the schema, so the form's TypeScript
 * types can never drift from the validation rules.
 */

/* ── Password policy ─────────────────────────────────────────────────────
   Defined ONCE here. Both the validation (passwordSchema) and the live
   checklist users see (PASSWORD_RULES → <PasswordRequirements>) are built
   from it, so what we show and what we enforce can never disagree.
   To change the policy, edit PASSWORD_RULES only. */

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES: {
  /** Shown in the checklist, e.g. "At least 8 characters". */
  label: string;
  /** Shown as the field error when the rule fails. */
  errorMessage: string;
  isMet: (password: string) => boolean;
}[] = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    errorMessage: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    isMet: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: "Includes a letter",
    errorMessage: "Password must include a letter",
    isMet: (password) => /[A-Za-z]/.test(password),
  },
  {
    label: "Includes a number",
    errorMessage: "Password must include a number",
    isMet: (password) => /\d/.test(password),
  },
];

export const passwordSchema = z.string().superRefine((password, ctx) => {
  // Report only the first unmet rule, so the user sees one clear message.
  const failed = PASSWORD_RULES.find((rule) => !rule.isMet(password));
  if (failed) ctx.addIssue({ code: "custom", message: failed.errorMessage });
});

/** Email: trimmed and lower-cased before validation, so " Ann@X.com " works. */
const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const signUpSchema = z.object({
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
export type SignUpInput = z.input<typeof signUpSchema>;
/** What you get after validation: clean data, safe to send to the API. */
export type SignUpValues = z.output<typeof signUpSchema>;
