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
