import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import type { KycStatus } from "@/features/kyc/kycStatus";
import type { LoginValues, SignUpValues } from "./authValidation";

/**
 * Auth service: the single place the UI talks to the auth backend.
 *
 * Components call these functions and never `fetch` directly, so when the
 * backend (or its URL, or the auth provider) changes, only this file changes.
 *
 * The backend doesn't exist yet, so in DEMO MODE (see config/demoMode.ts)
 * every call succeeds and any verification code is accepted. The TODO(api)
 * comments show the real call to add in each place.
 */

export type AuthResult = { ok: true } | { ok: false; message: string };

const NOT_AVAILABLE: { ok: false; message: string } = {
  ok: false,
  message: "Something went wrong. Please try again in a moment.",
};

/** Demo-mode wait on "Sign up", so the button's loading spinner shows for 3 seconds. */
const DEMO_SIGN_UP_DELAY_MS = 3000;

/** Creates the account; the server then emails a verification code. */
export async function signUp(values: SignUpValues): Promise<AuthResult> {
  // TODO(api): POST /api/auth/sign-up  { email, password, remember }
  void values;
  if (IS_DEMO_MODE) {
    await wait(DEMO_SIGN_UP_DELAY_MS);
    return { ok: true };
  }
  return NOT_AVAILABLE;
}

/** A successful log-in also says how far the user is in identity verification. */
export type LogInResult = { ok: true; kycStatus: KycStatus } | { ok: false; message: string };

export async function logIn(values: LoginValues): Promise<LogInResult> {
  // TODO(api): POST /api/auth/login → the server sets a secure httpOnly session
  //   cookie and returns the user's `kycStatus`.
  //   `values.remember` decides whether that cookie outlives the browser session.
  // Security: on failure always show the same generic message, never
  // "email not found" vs "wrong password", which would reveal who has an account.
  void values;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    // Demo: every account is treated as newly signed up, so it continues to KYC.
    return { ok: true, kycStatus: "not_started" };
  }
  return NOT_AVAILABLE;
}

/** Sends (or re-sends) the email verification code after sign-up. */
export async function sendEmailVerificationCode(email: string): Promise<AuthResult> {
  // TODO(api): POST /api/auth/verify-email/send  { email }
  void email;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true };
  }
  return NOT_AVAILABLE;
}

/** Checks the email verification code. Demo mode accepts any code. */
export async function verifyEmailCode(email: string, code: string): Promise<AuthResult> {
  // TODO(api): POST /api/auth/verify-email  { email, code }
  // Wrong code → { ok: false, message: "That code isn't right. Check your email and try again." }
  void email;
  void code;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true };
  }
  return NOT_AVAILABLE;
}

/** Social log-in providers shown under "or continue with". */
export type SocialProvider = "facebook" | "google" | "apple";

export async function logInWithProvider(provider: SocialProvider): Promise<AuthResult> {
  // TODO(api): redirect to the provider's OAuth flow once configured.
  void provider;
  return {
    ok: false,
    message: "Logging in with Google, Facebook or Apple is coming soon.",
  };
}
