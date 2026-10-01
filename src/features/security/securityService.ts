import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";

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
 * Turns on biometric verification (fingerprint / Face ID) for this device.
 *
 * Real implementation (WebAuthn passkey):
 *   1. GET a one-time challenge from the server
 *   2. navigator.credentials.create({ publicKey: { challenge, authenticatorSelection:
 *      { authenticatorAttachment: "platform", userVerification: "required" } } })
 *      → the phone shows its own fingerprint / face prompt
 *   3. POST the new public key to the server
 * The fingerprint itself never leaves the phone; the server only stores a public key.
 */
export async function registerBiometric(): Promise<SecurityResult> {
  // TODO(api): GET /api/security/biometric/challenge → WebAuthn create → POST /api/security/biometric
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true };
  }
  return { ok: false, message: "We couldn't set up biometrics. Please try again in a moment." };
}

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
