import { z } from "zod";

/**
 * Validation rules for "Fill Your Profile" (zod).
 * The server must re-check the same rules before saving.
 */

/** Minimum age to open an investment account. */
export const MINIMUM_AGE = 18;

/**
 * Earliest allowed date of birth (YYYY-MM-DD). The CEO set 1960 (October
 * 2026): earlier years aren't expected among investors, and a shorter list
 * makes the date picker quicker to scroll.
 */
export const EARLIEST_BIRTH_DATE = "1960-01-01";

/** Latest allowed date of birth (YYYY-MM-DD), i.e. exactly MINIMUM_AGE years ago today. */
export function latestBirthDate(today = new Date()): string {
  const date = new Date(today);
  date.setFullYear(date.getFullYear() - MINIMUM_AGE);
  return date.toISOString().slice(0, 10);
}

/**
 * Ghana mobile number WITHOUT the +233 prefix: 9 digits, e.g. "24 123 4567".
 * People often type the local form with a leading 0 ("024 123 4567"), so
 * spaces and one leading 0 are removed before checking.
 */
export const normaliseGhanaPhone = (value: string) => value.replace(/\D/g, "").replace(/^0/, "");

/**
 * GhanaPost GPS digital address, e.g. "GA-123-4567" or "AK-0391-2224":
 * 2 letters (region/district), 3–4 digits, 4 digits.
 */
const GHANA_POST_GPS = /^[A-Z]{2}-\d{3,4}-\d{4}$/;

/** Gender as printed on the ID (the Ghana Card records sex as male/female). */
export const GENDERS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
] as const;
export type Gender = (typeof GENDERS)[number]["id"];

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Enter your full name")
    .refine((name) => name.split(/\s+/).length >= 2, "Enter your first and last name, as on your ID")
    .refine((name) => /^[\p{L}\s'.-]+$/u.test(name), "Use letters only"),
  dateOfBirth: z
    .string()
    .min(1, "Enter your date of birth")
    .refine((value) => value <= latestBirthDate(), `You must be at least ${MINIMUM_AGE} to invest`)
    .refine((value) => value >= EARLIEST_BIRTH_DATE, "Enter a date of birth from 1960 onwards"),
  gender: z.enum(["male", "female"], { message: "Select your gender" }),
  // No email here: it's the one they signed up and verified with, shown on
  // the screen but locked (it can't be changed in this form).
  phone: z
    .string()
    .transform(normaliseGhanaPhone)
    .pipe(z.string().regex(/^\d{9}$/, "Enter a valid Ghana number, e.g. 24 123 4567")),
  digitalAddress: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.string().regex(GHANA_POST_GPS, "Enter a valid GhanaPost GPS address, e.g. GA-123-4567")),
});

/** What the form fields hold (as typed). */
export type ProfileInput = z.input<typeof profileSchema>;
/** Clean data after validation (trimmed, phone digits only, address upper-case). */
export type ProfileValues = z.output<typeof profileSchema>;
