import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import type { ResetMethod } from "./passwordResetValidation";

/**
 * Password-reset service: the single place the forgot-password screens
 * talk to the server. Screens never `fetch` directly, so connecting the
 * real backend only means changing this file.
 *
 * The backend doesn't exist yet, so in DEMO MODE (see config/demoMode.ts)
 * every step succeeds and any 4-digit code is accepted.
 *
 * Security notes for the real implementation:
 *   - requestResetCode must respond the same way whether or not an account
 *     exists for that email/phone, so attackers can't discover who has an account.
 *   - Codes must expire (e.g. after 10 minutes) and allow only a few attempts.
 *   - The server issues a one-time `resetToken` after a correct code; the
 *     new password is only accepted together with that token.
 */

const NOT_CONNECTED_MESSAGE = "Something went wrong. Please try again in a moment.";

export type ServiceResult<Data = undefined> =
  | { ok: true; data: Data }
  | { ok: false; message: string };

/** Step 1 (and "Resend code"): send a reset code by SMS or email. */
export async function requestResetCode(
  method: ResetMethod,
  contact: string,
): Promise<ServiceResult> {
  // TODO(api): POST /api/auth/password-reset/request  { method, contact }
  void method;
  void contact;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true, data: undefined };
  }
  return { ok: false, message: NOT_CONNECTED_MESSAGE };
}

/** Step 2: check the code; on success the server returns a one-time reset token. */
export async function verifyResetCode(
  contact: string,
  code: string,
): Promise<ServiceResult<{ resetToken: string }>> {
  // TODO(api): POST /api/auth/password-reset/verify  { contact, code }
  void contact;
  void code;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true, data: { resetToken: "demo-reset-token" } };
  }
  return { ok: false, message: NOT_CONNECTED_MESSAGE };
}

/** Step 3: save the new password, authorised by the reset token from step 2. */
export async function saveNewPassword(
  resetToken: string,
  newPassword: string,
): Promise<ServiceResult> {
  // TODO(api): POST /api/auth/password-reset/complete  { resetToken, newPassword }
  void resetToken;
  void newPassword;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true, data: undefined };
  }
  return { ok: false, message: NOT_CONNECTED_MESSAGE };
}
