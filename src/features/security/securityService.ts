import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import { confirmWithDevice, createDeviceCredential, randomChallenge } from "@/lib/webAuthn";

/**
 * Account-security service (PIN, later biometrics and 2-step verification):
 * the single place these screens talk to the server.
 *
 * In DEMO MODE (see config/demoMode.ts) every call succeeds, and the PIN
 * (hashed) and progress are saved in this browser (src/demo).
 */

export type SecurityResult = { ok: true } | { ok: false; message: string };

/**
 * Sets the user's security PIN.
 *
 * Server requirements (for the backend):
 *   - send only over HTTPS; never log the PIN
 *   - re-check the PIN rules (pinValidation.ts) on the server
 *   - store ONLY a salted, slow hash (e.g. Argon2 / bcrypt), never the PIN
 *   - lock PIN approval after a few wrong attempts
 */
export async function createPin(pin: string): Promise<SecurityResult> {
  // TODO(api): POST /api/security/pin  { pin }
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    const email = demo.getSessionEmail();
    if (email) {
      await demo.setPin(email, pin);
      demo.advanceStep(email, "two-factor");
    }
    // They just proved who they are, so no need to ask for the PIN again now.
    demo.markUnlocked();
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/**
 * Starts two-factor authentication (2FA) setup: texts a 6-digit code to
 * the user's phone. Entering it proves they own the number and turns 2FA on.
 *
 * Server requirements (for the backend):
 *   - send to the phone number ON THE ACCOUNT, never one sent by the browser
 *   - codes: random, single use, expire after ~10 minutes
 *   - rate-limit sends (e.g. 1 per 60 s, 5 per hour) to stop SMS abuse
 */
export async function sendTwoFactorSetupCode(): Promise<SecurityResult> {
  // TODO(api): POST /api/security/two-factor/sms/start
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true };
  }
  return { ok: false, message: "We couldn't send the code. Please try again in a moment." };
}

/**
 * Turns on fingerprint / Face ID for this device and finishes registration.
 * Shows the device's own prompt (see lib/webAuthn.ts).
 *
 * Production flow:
 *   1. GET a one-time challenge (+ user handle) from the server
 *   2. createDeviceCredential → the phone prompts, creates a key pair
 *   3. POST the public key + credential ID to the server
 * The fingerprint / face never leaves the phone; the server only stores a public key.
 */
export async function registerBiometric(): Promise<SecurityResult> {
  // TODO(api): GET /api/security/biometric/challenge → create → POST /api/security/biometric
  const email = demo.getSessionEmail();
  const result = await createDeviceCredential({
    challenge: randomChallenge(), // TODO(api): from the server
    userId: crypto.getRandomValues(new Uint8Array(16)), // TODO(api): the server's user handle
    userName: email ?? "Feenicks1 user",
    displayName: email ?? "Feenicks1 user",
  });
  if (!result.ok) return { ok: false, message: BIOMETRIC_ERRORS[result.reason] };

  if (IS_DEMO_MODE) {
    demo.updateSessionAccount({ biometricCredentialId: result.credentialId, twoFactorMethod: "biometric" });
    demo.advanceSessionStep("complete");
    // They just confirmed with fingerprint / face: don't ask again right away.
    demo.markUnlocked();
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/**
 * Unlocks the app with fingerprint / Face ID instead of the PIN (returning users).
 * The server must verify the signed challenge before trusting it.
 */
export async function verifyBiometric(): Promise<SecurityResult> {
  // TODO(api): GET /api/security/biometric/challenge → confirm → POST /api/security/biometric/verify
  const email = demo.getSessionEmail();
  const credentialId = email ? demo.findAccount(email)?.biometricCredentialId : undefined;
  if (!credentialId) return { ok: false, message: BIOMETRIC_ERRORS.unsupported };

  const result = await confirmWithDevice({ challenge: randomChallenge(), credentialId });
  if (!result.ok) return { ok: false, message: BIOMETRIC_ERRORS[result.reason] };

  if (IS_DEMO_MODE) {
    demo.markUnlocked();
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/** What to tell the user when the fingerprint / face prompt doesn't succeed. */
const BIOMETRIC_ERRORS = {
  cancelled: "Cancelled. Try again, or choose another option.",
  unsupported: "Fingerprint / Face ID isn't available on this device.",
  failed: "That didn't work. Please try again.",
} as const;

/**
 * Checks the PIN of a returning user (after log-in, before the dashboard).
 *
 * Server requirements (for the backend):
 *   - compare against the stored hash only
 *   - count wrong attempts ON THE SERVER and lock the session after a few
 *     (the screen's own counter is only a courtesy; it can be bypassed)
 */
export async function verifyPin(pin: string): Promise<SecurityResult> {
  // TODO(api): POST /api/security/pin/verify  { pin }
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    const email = demo.getSessionEmail();
    if (!email || !(await demo.checkPin(email, pin))) {
      return { ok: false, message: "Wrong PIN. Please try again." };
    }
    demo.markUnlocked();
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/**
 * Marks registration as finished: called once the user has set up 2FA or
 * chosen to skip it. From now on, log-in leads to Enter PIN → dashboard.
 */
export async function completeAccountSetup(): Promise<SecurityResult> {
  // TODO(api): POST /api/account/setup-complete
  if (IS_DEMO_MODE) {
    demo.advanceSessionStep("complete");
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/** The ways a user can prove it's them (see ChooseTwoFactorMethodScreen). */
export type TwoFactorMethod = "biometric" | "sms" | "authenticator-app";

/**
 * SMS 2FA setup, step 2: checks the code texted by sendTwoFactorSetupCode.
 * A correct code turns on SMS 2FA and finishes registration.
 *
 * Server requirements (for the backend):
 *   - single-use code, expires (~10 min), max ~5 wrong tries then a new code
 *   - only then mark the phone as verified and SMS 2FA as on
 */
export async function confirmTwoFactorSmsCode(code: string): Promise<SecurityResult> {
  // TODO(api): POST /api/security/two-factor/sms/confirm  { code }
  // Wrong code → { ok: false, message: "That code isn't right. Check your messages and try again." }
  void code;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    demo.updateSessionAccount({ twoFactorMethod: "sms" });
    demo.advanceSessionStep("complete");
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}
