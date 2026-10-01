/**
 * WebAuthn helpers: fingerprint / Face ID sign-in through the browser
 * (the same standard as passkeys).
 *
 * How it works:
 *   - Setup (`createDeviceCredential`): the phone shows its own fingerprint
 *     or face prompt, then creates a key pair. The private key never leaves
 *     the phone; we get a credential ID + public key for the server.
 *   - Sign-in (`confirmWithDevice`): the phone prompts again and signs a
 *     one-time challenge with that key. The server checks the signature.
 *
 * The fingerprint / face itself is never seen by the browser or by us.
 * Which one is used is decided by the device, not by the website.
 *
 * Challenges must come from the server in production (random, single use).
 */

/** What the device offers, used only for the right icon and wording. */
export type BiometricKind = "face" | "fingerprint";

/**
 * Best guess for icon and wording: iPhones/iPads → Face ID, everything else
 * → fingerprint. (Browsers don't reveal the real sensor; an older iPhone
 * with Touch ID still gets the right prompt from the phone itself.)
 */
export function guessBiometricKind(): BiometricKind {
  if (typeof navigator === "undefined") return "fingerprint";
  const isAppleTouchDevice =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac; touch support gives it away.
    (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isAppleTouchDevice ? "face" : "fingerprint";
}

export type WebAuthnResult =
  | { ok: true; credentialId: string }
  | { ok: false; reason: "cancelled" | "unsupported" | "failed" };

const toBase64Url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (text: string) =>
  Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** A random challenge. DEMO ONLY: in production the server provides it. */
export const randomChallenge = () => crypto.getRandomValues(new Uint8Array(32));

/** The user cancelled or the prompt timed out → "cancelled"; anything else → "failed". */
function toFailure(error: unknown): WebAuthnResult {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "AbortError") return { ok: false, reason: "cancelled" };
  if (name === "NotSupportedError" || name === "SecurityError") return { ok: false, reason: "unsupported" };
  return { ok: false, reason: "failed" };
}

/** Sets up fingerprint / Face ID on this device (shows the device's prompt). */
export async function createDeviceCredential(options: {
  challenge: Uint8Array;
  /** Stable, non-personal ID for the account (not the email). */
  userId: Uint8Array;
  /** Shown by the device in its passkey list, e.g. the email. */
  userName: string;
  displayName: string;
}): Promise<WebAuthnResult> {
  if (!window.PublicKeyCredential) return { ok: false, reason: "unsupported" };
  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: options.challenge as BufferSource,
        rp: { name: "Feenicks1" },
        user: {
          id: options.userId as BufferSource,
          name: options.userName,
          displayName: options.displayName,
        },
        // ES256 (most devices) and RS256 (Windows Hello).
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // this phone/laptop, not a USB key
          userVerification: "required", // fingerprint / face / device PIN must be used
          residentKey: "preferred",
        },
        attestation: "none",
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) return { ok: false, reason: "cancelled" };
    // TODO(api): send credential.response (attestationObject, clientDataJSON) to the server.
    return { ok: true, credentialId: toBase64Url(credential.rawId) };
  } catch (error) {
    return toFailure(error);
  }
}

/** Asks the device to confirm it's the user (fingerprint / Face ID prompt). */
export async function confirmWithDevice(options: {
  challenge: Uint8Array;
  credentialId: string;
}): Promise<WebAuthnResult> {
  if (!window.PublicKeyCredential) return { ok: false, reason: "unsupported" };
  try {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: options.challenge as BufferSource,
        allowCredentials: [
          { type: "public-key", id: fromBase64Url(options.credentialId) as BufferSource },
        ],
        userVerification: "required",
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) return { ok: false, reason: "cancelled" };
    // TODO(api): send assertion.response (signature, authenticatorData, clientDataJSON)
    //   to the server, which verifies it with the stored public key.
    return { ok: true, credentialId: toBase64Url(assertion.rawId) };
  } catch (error) {
    return toFailure(error);
  }
}
