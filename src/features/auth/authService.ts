import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import type { AccountStep } from "./accountProgress";
import type { LoginValues, SignUpValues } from "./authValidation";

/**
 * Auth service: the single place the UI talks to the auth backend.
 *
 * Components call these functions and never `fetch` directly, so when the
 * backend (or its URL, or the auth provider) changes, only this file changes.
 *
 * The backend doesn't exist yet, so in DEMO MODE (see config/demoMode.ts)
 * accounts are kept in this browser (src/demo/demoAccounts.ts) and any
 * verification code is accepted. The TODO(api) comments show the real call
 * to add in each place.
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
  if (IS_DEMO_MODE) {
    await wait(DEMO_SIGN_UP_DELAY_MS);
    const account = await demo.createAccount(values.email, values.password);
    if (!account) {
      return { ok: false, message: "An account with this email already exists. Log in instead." };
    }
    return { ok: true };
  }
  return NOT_AVAILABLE;
}

/**
 * A successful log-in also says how far the user got through registration,
 * so they continue where they left off (see accountProgress.ts).
 */
export type LogInResult =
  | { ok: true; email: string; nextStep: AccountStep }
  | { ok: false; message: string };

/** One message for every failed log-in (see the security note in logIn). */
const WRONG_CREDENTIALS = "Incorrect email or password. Check them and try again.";

export async function logIn(values: LoginValues): Promise<LogInResult> {
  // TODO(api): POST /api/auth/login → the server sets a secure httpOnly session
  //   cookie and returns the account's `nextStep`.
  //   `values.remember` decides whether that cookie outlives the browser session.
  //   Lock or slow down log-in after repeated failures (brute-force protection).
  // Security: on failure always show the same generic message, never
  // "email not found" vs "wrong password", which would reveal who has an account.
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    const account = await demo.checkPassword(values.email, values.password);
    if (!account) return { ok: false, message: WRONG_CREDENTIALS };
    demo.startSession(account.email, values.remember);
    return { ok: true, email: account.email, nextStep: account.step };
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
  void code;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    demo.advanceStep(email, "kyc-investment-goals");
    return { ok: true };
  }
  return NOT_AVAILABLE;
}

/** Ends the session on this device. */
export async function logOut(): Promise<void> {
  // TODO(api): POST /api/auth/logout → the server deletes the session cookie.
  if (IS_DEMO_MODE) demo.endSession();
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
