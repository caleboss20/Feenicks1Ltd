import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import { maskGhanaPhone } from "@/lib/maskContactDetails";
import { verifyTotp } from "@/lib/totp";
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

/**
 * Creates the account; the server then emails a verification code.
 * `referralCode`: the friend's code when the user came from an invite link
 * or QR code (see referralService), so the friend can be rewarded.
 */
export async function signUp(
  values: SignUpValues,
  { referralCode }: { referralCode?: string | null } = {},
): Promise<AuthResult> {
  // TODO(api): POST /api/auth/sign-up  { email, password, remember, referralCode }
  //   The server checks the code and credits the friend (see referralService).
  if (IS_DEMO_MODE) {
    // Demo: nothing to credit without a server, so the code is only shown on screen.
    void referralCode;
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
 * Log-in result:
 *   "signed-in"            password OK, no 2FA needed → continue where they left off
 *                          (see accountProgress.ts)
 *   "two-factor-required"  password OK, but 2FA is on and this device isn't
 *                          remembered → NOT signed in yet; the user must enter
 *                          a code first (LoginTwoStepScreen)
 */
export type LogInResult =
  | { ok: true; status: "signed-in"; email: string; nextStep: AccountStep }
  | { ok: true; status: "two-factor-required"; challenge: LoginChallenge }
  | { ok: false; message: string };

/** The 2FA methods that ask for a code at log-in (fingerprint is checked on the PIN screen). */
export type LoginCodeMethod = "sms" | "authenticator-app";

/**
 * A pending log-in, waiting for its 2FA code. Short-lived and single-use.
 * In production `token` is an opaque server ID; the browser never learns
 * the account's secrets.
 */
export type LoginChallenge = {
  token: string;
  method: LoginCodeMethod;
  /** Where an SMS code goes, already masked: "+233 *******67". */
  maskedPhone: string;
  /** After this (ms timestamp) the user must log in again. */
  expiresAt: number;
  /** "Remember me" from the log-in form, applied once the code is right. */
  rememberSession: boolean;
};

/** A pending log-in must be finished within this time. */
const LOGIN_CHALLENGE_TTL_MS = 10 * 60 * 1000;

/** "Remember this device" lasts this long. */
export const REMEMBER_DEVICE_DAYS = 30;

/** Demo only: the pretend challenge token carries the email (see logIn). */
const DEMO_CHALLENGE_PREFIX = "demo-login:";

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

    // 2FA on and this device not remembered → ask for a code BEFORE signing in.
    const method = account.twoFactorMethod;
    if ((method === "sms" || method === "authenticator-app") && !demo.isDeviceRemembered(account.email)) {
      // TODO(api): for SMS, the server texts the code here.
      return {
        ok: true,
        status: "two-factor-required",
        challenge: {
          token: `${DEMO_CHALLENGE_PREFIX}${account.email}`,
          method,
          maskedPhone: maskGhanaPhone(account.phone),
          expiresAt: Date.now() + LOGIN_CHALLENGE_TTL_MS,
          rememberSession: values.remember,
        },
      };
    }

    demo.startSession(account.email, values.remember);
    return { ok: true, status: "signed-in", email: account.email, nextStep: account.step };
  }
  return NOT_AVAILABLE;
}

/**
 * Log-in 2FA: checks the code for a pending log-in, then signs the user in.
 *
 * Server requirements (for the backend):
 *   - the challenge is single-use, expires (10 min) and allows max 5 wrong codes
 *   - authenticator codes: TOTP check (±30 s); a used code can't be reused
 *   - only after a correct code: create the session cookie, and if
 *     `rememberDevice`, a signed httpOnly device cookie for 30 days
 *   - email the user "New sign-in to your account" for new devices
 */
export async function verifyLoginCode(
  challenge: LoginChallenge,
  code: string,
  rememberDevice: boolean,
): Promise<{ ok: true; nextStep: AccountStep } | { ok: false; message: string }> {
  // TODO(api): POST /api/auth/login/verify  { challengeToken, code, rememberDevice }
  if (Date.now() > challenge.expiresAt) {
    return { ok: false, message: "This sign-in has expired. Please log in again." };
  }
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    const account = demo.findAccount(challenge.token.replace(DEMO_CHALLENGE_PREFIX, ""));
    if (!account) return { ok: false, message: "This sign-in has expired. Please log in again." };

    // Authenticator: a real check against the app. SMS: any code in demo mode.
    const isCorrect =
      challenge.method === "authenticator-app"
        ? Boolean(account.totpSecret) && (await verifyTotp(account.totpSecret!, code))
        : /^\d{6}$/.test(code);
    if (!isCorrect) {
      return {
        ok: false,
        message:
          challenge.method === "authenticator-app"
            ? "That code isn't right. Use the newest code from your app."
            : "That code isn't right. Check your messages and try again.",
      };
    }

    if (rememberDevice) demo.rememberThisDevice(account.email, REMEMBER_DEVICE_DAYS);
    demo.startSession(account.email, challenge.rememberSession);
    return { ok: true, nextStep: account.step };
  }
  return NOT_AVAILABLE;
}

/**
 * "Use another way": texts a code to the account's phone for THIS log-in
 * only (e.g. the authenticator app isn't at hand). The 2FA method itself
 * never changes here; that's only possible in Security settings, after
 * logging in and confirming with the PIN.
 */
export async function sendLoginSmsCode(
  challenge: LoginChallenge,
): Promise<{ ok: true; challenge: LoginChallenge } | { ok: false; message: string }> {
  // TODO(api): POST /api/auth/login/sms  { challengeToken } (rate-limited)
  if (Date.now() > challenge.expiresAt) {
    return { ok: false, message: "This sign-in has expired. Please log in again." };
  }
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true, challenge: { ...challenge, method: "sms" } };
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
