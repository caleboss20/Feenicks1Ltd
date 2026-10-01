"use client";

import { useEffect, useState } from "react";

/**
 * Whether this device can verify the user with its own biometrics
 * (fingerprint, Face ID, Windows Hello…), via the browser's WebAuthn
 * "platform authenticator". This is the same check passkey sign-in uses.
 *
 * Returns `null` while checking, then `true` / `false`.
 *
 * Re-checked every time the user comes back to the app (tab visible
 * again). So if the option was unavailable, and they go to the phone's
 * Settings to add a screen lock or fingerprint, it turns on by itself
 * when they return, without a refresh.
 *
 * Note: `true` means the device has a biometric (or screen-lock) unlock
 * the browser can use. Phones with no screen lock set, most desktops
 * without Windows Hello, and older browsers return `false`.
 */
export function useBiometricSupport(): boolean | null {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkSupport = () => {
      const check = window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable;
      // Always resolved asynchronously, so state is never set during the effect itself.
      Promise.resolve(check ? check.call(window.PublicKeyCredential) : false)
        .catch(() => false)
        .then((available) => {
          if (!cancelled) setIsSupported(available);
        });
    };

    // Back from the phone's Settings (or another app/tab) → check again.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkSupport();
    };

    checkSupport();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return isSupported;
}
