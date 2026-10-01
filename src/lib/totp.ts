/**
 * TOTP: the 6-digit codes shown by authenticator apps (Google Authenticator,
 * Microsoft Authenticator, Authy…). Standard RFC 6238, same as every bank.
 *
 * How it works:
 *   1. We create a random SECRET and show it as a QR code.
 *   2. The app scans it and stores the secret.
 *   3. Every 30 seconds, the app and we both compute
 *        code = HMAC-SHA1(secret, current 30-second window) → 6 digits
 *      Same secret + same time = same code. No network needed.
 *
 * Uses the browser's built-in Web Crypto (no library).
 *
 * ⚠️ In production the SECRET must be created and checked on the server
 * (stored encrypted), never only in the browser. The demo uses these
 * helpers in the browser so the flow works before the backend exists.
 */

/** Seconds each code is valid for (the apps' default). */
export const TOTP_PERIOD_SECONDS = 30;
/** Digits per code (the apps' default). */
export const TOTP_DIGITS = 6;

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Bytes → Base32 (the format authenticator apps expect), no padding. */
function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function fromBase32(text: string): Uint8Array {
  const clean = text.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

/** A new random secret: 160 bits (the RFC's recommended size), as Base32. */
export function generateTotpSecret(): string {
  return toBase32(crypto.getRandomValues(new Uint8Array(20)));
}

/** "I3SJDYUF…" → "I3SJ DYUF …" (groups of 4, easier to type by hand). */
export function formatTotpSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * The link inside the QR code. Apps read it to add the account:
 * otpauth://totp/Feenicks1:ama@example.com?secret=…&issuer=Feenicks1
 */
export function buildOtpAuthUri({
  secret,
  accountName,
  issuer,
}: {
  secret: string;
  accountName: string;
  issuer: string;
}): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params}`;
}

/** The code for one 30-second window. */
async function codeForWindow(secret: string, window: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    fromBase32(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  // The window number as an 8-byte big-endian counter.
  const counter = new ArrayBuffer(8);
  new DataView(counter).setUint32(4, window);
  const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", key, counter));

  // "Dynamic truncation" (RFC 4226): pick 4 bytes, keep 31 bits, last N digits.
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

/**
 * True if `code` matches now, or one window before/after (allows ±30 s of
 * clock difference between the phone and us, the usual tolerance).
 */
export async function verifyTotp(secret: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const now = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
  for (const window of [now - 1, now, now + 1]) {
    if ((await codeForWindow(secret, window)) === code) return true;
  }
  return false;
}

/** Seconds until the apps show a new code (30 → 1). */
export function secondsUntilNextCode(): number {
  return TOTP_PERIOD_SECONDS - (Math.floor(Date.now() / 1000) % TOTP_PERIOD_SECONDS);
}

/** For tests/demo only: the current code for a secret. */
export async function currentTotpCode(secret: string): Promise<string> {
  return codeForWindow(secret, Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS));
}
