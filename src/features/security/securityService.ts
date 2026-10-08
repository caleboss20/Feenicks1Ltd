import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import { ROUTES } from "@/config/routes";
import * as demo from "@/demo/demoAccounts";
import { notify, notifySessionAccount } from "@/demo/demoNotifications";
import { buildOtpAuthUri, generateTotpSecret, verifyTotp } from "@/lib/totp";
import { confirmWithDevice, createDeviceCredential, guessBiometricKind, randomChallenge } from "@/lib/webAuthn";

/**
 * Account-security service (PIN, later biometrics and 2-step verification):
 * the single place these screens talk to the server.
 *
 * In DEMO MODE (see config/demoMode.ts) every call succeeds, and the PIN
 * (hashed) and progress are saved in this browser (src/demo).
 */

export type SecurityResult = { ok: true } | { ok: false; message: string };

/* ── Demo backend helpers ────────────────────────────────────────────── */

/** "Fingerprint" or "Face ID", as this phone calls it (for notifications). */
const biometricName = () => (guessBiometricKind() === "face" ? "Face ID" : "Fingerprint");

/**
 * Registration is finished (two-step verification set up, or skipped). The
 * first time only, the account gets its welcome notification.
 */
function finishSetup() {
  const email = demo.getSessionEmail();
  const wasComplete = email ? demo.findAccount(email)?.step === "complete" : true;
  demo.advanceSessionStep("complete");
  // Just verified (or chose to skip): counts as fresh activity for auto-lock.
  demo.markUnlocked();
  if (email && !wasComplete) {
    notify(email, {
      kind: "account",
      title: "Welcome to Feenicks1",
      body: "Your account is set up. Take a look at the packages when you're ready to invest.",
      href: ROUTES.invest,
    });
  }
}

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
    notifySessionAccount({
      kind: "security",
      title: `${biometricName()} is on`,
      body: `You'll confirm it's you with ${biometricName() === "Face ID" ? "Face ID" : "your fingerprint"} on this phone.`,
    });
    // They just confirmed with fingerprint / face: don't ask again right away.
    finishSetup();
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
 * Turns fingerprint / Face ID unlock on from the Account screen. Same device
 * prompt and key as `registerBiometric`, but outside registration: the
 * account's sign-in two-factor method is left as it is.
 */
export async function enableBiometricUnlock(): Promise<SecurityResult> {
  // TODO(api): GET /api/security/biometric/challenge → create → POST /api/security/biometric
  const email = demo.getSessionEmail();
  const result = await createDeviceCredential({
    challenge: randomChallenge(), // TODO(api): from the server
    userId: crypto.getRandomValues(new Uint8Array(16)), // TODO(api): the server's user handle
    userName: email ?? "Feenicks1 user",
    displayName: email ?? "Feenicks1 user",
  });
  if (!result.ok) {
    return {
      ok: false,
      message: result.reason === "cancelled" ? "Cancelled. It's still off." : BIOMETRIC_ERRORS[result.reason],
    };
  }

  if (IS_DEMO_MODE) {
    demo.updateSessionAccount({ biometricCredentialId: result.credentialId });
    notifySessionAccount({
      kind: "security",
      title: `${biometricName()} unlock is on`,
      body: `You can open the app with ${biometricName() === "Face ID" ? "Face ID" : "your fingerprint"} on this phone.`,
    });
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/**
 * Turns fingerprint / Face ID unlock off: the app unlocks with the PIN only.
 * (No PIN needed to turn it off: it removes a way in, it doesn't add one.)
 */
export async function disableBiometricUnlock(): Promise<SecurityResult> {
  // TODO(api): DELETE /api/security/biometric (the server forgets the public key)
  if (IS_DEMO_MODE) {
    demo.updateSessionAccount({ biometricCredentialId: undefined });
    notifySessionAccount({
      kind: "security",
      title: `${biometricName()} unlock is off`,
      body: "The app now opens with your PIN only.",
    });
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
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
    finishSetup();
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
    notifySessionAccount({
      kind: "security",
      title: "Two-step verification is on",
      body: "When you log in on a new device, we'll text a code to your phone.",
    });
    finishSetup();
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/**
 * Locks the app (auto-lock after inactivity). The user stays logged in;
 * the PIN or fingerprint / Face ID is needed to continue.
 */
export async function lockApp(): Promise<void> {
  // TODO(api): optionally POST /api/security/lock so the server also requires a re-check.
  if (IS_DEMO_MODE) demo.lockSession();
}

/* ── Forgot PIN ──────────────────────────────────────────────────────── */

/** A correct reset code returns a one-time token that allows choosing a new PIN. */
export type PinResetCodeResult = { ok: true; resetToken: string } | { ok: false; message: string };

/**
 * Forgot PIN, step 1: texts a 6-digit code to the phone ON THE ACCOUNT.
 *
 * Server requirements (for the backend):
 *   - only for a logged-in session (password already checked)
 *   - send to the account's phone, never a number from the browser
 *   - rate-limit sends; codes single-use, expire after ~10 minutes
 */
export async function requestPinResetCode(): Promise<SecurityResult> {
  // TODO(api): POST /api/security/pin/reset/request
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true };
  }
  return { ok: false, message: "We couldn't send the code. Please try again in a moment." };
}

/** Forgot PIN, step 2: checks the code; returns a one-time reset token. Demo accepts any code. */
export async function verifyPinResetCode(code: string): Promise<PinResetCodeResult> {
  // TODO(api): POST /api/security/pin/reset/verify  { code } → { resetToken }
  // Wrong code → { ok: false, message: "That code isn't right. Check your messages and try again." }
  void code;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true, resetToken: "demo-pin-reset" };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/**
 * Forgot PIN, step 3: saves the new PIN, authorised by the reset token.
 * The new PIN must differ from the current one. Unlocks the app on success.
 */
export async function resetPin(resetToken: string, newPin: string): Promise<SecurityResult> {
  // TODO(api): POST /api/security/pin/reset  { resetToken, pin }
  //   The server re-checks the PIN rules and stores only a hash.
  void resetToken;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    const email = demo.getSessionEmail();
    if (email && (await demo.checkPin(email, newPin))) {
      return { ok: false, message: "That's your current PIN. Choose a different one." };
    }
    if (email) {
      await demo.setPin(email, newPin);
      notify(email, {
        kind: "security",
        title: "PIN changed",
        body: "Your app PIN was changed. If you didn't do this, contact us straight away.",
        href: ROUTES.support,
      });
    }
    demo.markUnlocked();
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}

/* ── Authenticator app (TOTP) ────────────────────────────────────────── */

/** What the QR screen shows: the secret (typed by hand) and the link inside the QR code. */
export type AuthenticatorSetup = { secret: string; otpAuthUri: string };

/**
 * Authenticator setup, step 1: a new secret for the user's app.
 *
 * Server requirements (for the backend):
 *   - create the secret on the server (random, 160 bits) and store it
 *     ENCRYPTED, marked "pending" until a correct code is entered
 *   - never log it; show it only on this screen
 */
export async function startAuthenticatorSetup(): Promise<AuthenticatorSetup> {
  // TODO(api): POST /api/security/two-factor/authenticator/start → { secret, otpAuthUri }
  const secret = generateTotpSecret();
  const accountName = demo.getSessionEmail() ?? "Feenicks1 account";
  return { secret, otpAuthUri: buildOtpAuthUri({ secret, accountName, issuer: "Feenicks1" }) };
}

/**
 * Authenticator setup, step 2: checks the 6-digit code from the app.
 * Correct → authenticator 2FA is on and registration is complete.
 */
export async function confirmAuthenticatorSetup(secret: string, code: string): Promise<SecurityResult> {
  // TODO(api): POST /api/security/two-factor/authenticator/confirm  { code }
  //   (the server already holds the pending secret; it is never sent back).
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    // Real check, even in demo: the code must match the app.
    if (!(await verifyTotp(secret, code))) {
      return {
        ok: false,
        message: "That code isn't right. Codes change every 30 seconds, so use the newest one.",
      };
    }
    demo.updateSessionAccount({ totpSecret: secret, twoFactorMethod: "authenticator-app" });
    notifySessionAccount({
      kind: "security",
      title: "Two-step verification is on",
      body: "When you log in on a new device, we'll ask for a code from your authenticator app.",
    });
    finishSetup();
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}
