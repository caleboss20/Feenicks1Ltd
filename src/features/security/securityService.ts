import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";

/**
 * Account-security service (PIN, later biometrics and 2-step verification):
 * the single place these screens talk to the server.
 *
 * In DEMO MODE (see config/demoMode.ts) every call succeeds.
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
  void pin;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
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
