import { z } from "zod";

/**
 * Username rules (Edit profile), checked before saving:
 *   - 3–20 characters
 *   - letters, numbers, dots (.) and underscores (_), starting with a letter
 *   - no two dots in a row, and not ending with a dot
 * Saved in lowercase, without the "@". The server also checks it's not taken
 * (and not a reserved word such as "admin" or "support").
 */
export const USERNAME_MAX_LENGTH = 20;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 characters.")
  .max(USERNAME_MAX_LENGTH, `Use at most ${USERNAME_MAX_LENGTH} characters.`)
  .regex(/^[a-z]/, "Start with a letter.")
  .regex(/^[a-z0-9._]+$/, "Use only letters, numbers, dots (.) and underscores (_).")
  .refine((username) => !username.includes(".."), "Don't use two dots in a row.")
  .refine((username) => !username.endsWith("."), "Don't end with a dot.");
