"use client";

import { useEffect, useState } from "react";

/**
 * Whether this device can verify the user with its own biometrics
 * (fingerprint, Face ID, Windows Hello…), via the browser's WebAuthn
 * "platform authenticator". This is the same check passkey sign-in uses.
 *
 * Returns `null` while checking, then `true` / `false`.
 *
 * Note: `true` means the device has a biometric (or screen-lock) unlock
 * the browser can use. Phones without a fingerprint sensor, most desktops
 * and older browsers return `false`.
 */
export function useBiometricSupport(): boolean | null {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable;

    // Always resolved asynchronously, so state is never set during the effect itself.
    Promise.resolve(check ? check.call(window.PublicKeyCredential) : false)
      .catch(() => false)
      .then((available) => {
        if (!cancelled) setIsSupported(available);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return isSupported;
}
