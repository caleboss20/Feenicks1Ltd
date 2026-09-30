/**
 * One-time verification code settings, shared by every code screen
 * (email verification after sign-up, password reset, later phone checks).
 */

/** How many digits a code has (matches the design: 4 boxes). */
export const VERIFICATION_CODE_LENGTH = 4;

/** Seconds the user must wait before asking for a new code. */
export const RESEND_CODE_AFTER_SECONDS = 60;
