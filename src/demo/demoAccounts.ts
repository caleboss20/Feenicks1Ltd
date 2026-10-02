/**
 * ⚠️ DEMO ONLY: a pretend backend that keeps accounts in THIS browser.
 *
 * Lets the whole app be used before the real server exists: sign up, log
 * out, log back in and carry on where you left off. Used only by the
 * `…Service.ts` files when IS_DEMO_MODE is on. Screens never import it.
 *
 * Delete the `src/demo` folder once the real API is connected. In
 * production all of this lives on the server:
 *   - accounts in the database, passwords/PINs hashed with Argon2 or bcrypt
 *   - the session in a secure, httpOnly cookie (JavaScript can't read it)
 *
 * Even here, passwords and PINs are never stored as typed: only a salted
 * PBKDF2 hash (browser Web Crypto), so nothing readable sits in localStorage.
 */

import { isStepAfter, type AccountStep } from "@/features/auth/accountProgress";
import type { RiskLevel } from "@/features/investor-profile/riskProfileQuestions";

const ACCOUNTS_KEY = "feenicks1-demo-accounts";
/** Who is logged in: localStorage if "Remember me" was ticked, else sessionStorage. */
const SESSION_KEY = "feenicks1-demo-session";
/** When the PIN (or fingerprint) was last entered in this tab: a timestamp in ms. */
const UNLOCKED_KEY = "feenicks1-demo-unlocked";

/** A salted one-way hash of a password or PIN. */
type SecretHash = { salt: string; hash: string };

export type DemoAccount = {
  email: string;
  password: SecretHash;
  step: AccountStep;
  fullName?: string;
  gender?: "male" | "female";
  /** 9 digits, without +233 or the leading 0. */
  phone?: string;
  pin?: SecretHash;
  /** The two-factor method turned on, if any. */
  twoFactorMethod?: "sms" | "biometric" | "authenticator-app";
  /** Fingerprint / Face ID key on this device (WebAuthn credential ID). */
  biometricCredentialId?: string;
  /** Authenticator-app secret (Base32). In production: server-side, encrypted. */
  totpSecret?: string;
  /** Investor risk profile result (see investor-profile/riskProfileQuestions.ts). */
  riskProfile?: { level: RiskLevel; score: number; answeredAt: string };
  createdAt: string;
};

/* ── Hashing ─────────────────────────────────────────────────────────── */

const PBKDF2_ITERATIONS = 100_000;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function hashSecret(secret: string, salt?: Uint8Array): Promise<SecretHash> {
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes as BufferSource, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return { salt: toBase64(saltBytes), hash: toBase64(new Uint8Array(bits)) };
}

async function matchesSecret(secret: string, stored: SecretHash): Promise<boolean> {
  const { hash } = await hashSecret(secret, fromBase64(stored.salt));
  return hash === stored.hash;
}

/* ── Account storage ─────────────────────────────────────────────────── */

const normaliseEmail = (email: string) => email.trim().toLowerCase();

/** Storage can be blocked (private mode, disabled site data), so never let it crash the app. */
function readJson<T>(storage: Storage | undefined, key: string): T | null {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(storage: Storage | undefined, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the demo just won't remember this change.
  }
}

const local = () => (typeof window === "undefined" ? undefined : window.localStorage);
const session = () => (typeof window === "undefined" ? undefined : window.sessionStorage);

function readAccounts(): Record<string, DemoAccount> {
  return readJson<Record<string, DemoAccount>>(local(), ACCOUNTS_KEY) ?? {};
}

export function findAccount(email: string): DemoAccount | null {
  return readAccounts()[normaliseEmail(email)] ?? null;
}

export function findAccountByPhone(phone: string): DemoAccount | null {
  const digits = phone.replace(/\D/g, "").replace(/^(233|0)/, "");
  return Object.values(readAccounts()).find((account) => account.phone === digits) ?? null;
}

function saveAccount(account: DemoAccount) {
  writeJson(local(), ACCOUNTS_KEY, { ...readAccounts(), [account.email]: account });
  notifySessionChange();
}

/** Creates an account. Returns null if the email is already registered. */
export async function createAccount(email: string, password: string): Promise<DemoAccount | null> {
  const key = normaliseEmail(email);
  if (findAccount(key)) return null;

  const account: DemoAccount = {
    email: key,
    password: await hashSecret(password),
    step: "verify-email",
    createdAt: new Date().toISOString(),
  };
  saveAccount(account);
  return account;
}

/** The account, if the email and password match; otherwise null. */
export async function checkPassword(email: string, password: string): Promise<DemoAccount | null> {
  const account = findAccount(email);
  if (!account) return null;
  return (await matchesSecret(password, account.password)) ? account : null;
}

export async function changePassword(email: string, newPassword: string) {
  const account = findAccount(email);
  if (account) saveAccount({ ...account, password: await hashSecret(newPassword) });
}

/** Saves details (name, phone…) on an account. */
export function updateAccount(
  email: string,
  details: Partial<
    Pick<
      DemoAccount,
      | "fullName"
      | "gender"
      | "phone"
      | "twoFactorMethod"
      | "biometricCredentialId"
      | "totpSecret"
      | "riskProfile"
    >
  >,
) {
  const account = findAccount(email);
  if (account) saveAccount({ ...account, ...details });
}

/** Moves the account to `step`, but only forward, never back. */
export function advanceStep(email: string, step: AccountStep) {
  const account = findAccount(email);
  if (account && isStepAfter(step, account.step)) saveAccount({ ...account, step });
}

export async function setPin(email: string, pin: string) {
  const account = findAccount(email);
  if (account) saveAccount({ ...account, pin: await hashSecret(pin) });
}

export async function checkPin(email: string, pin: string): Promise<boolean> {
  const account = findAccount(email);
  return Boolean(account?.pin && (await matchesSecret(pin, account.pin)));
}

/* ── Session (who is logged in) ──────────────────────────────────────── */

/** Logs in `email`. "Remember me" keeps it after the browser closes. */
export function startSession(email: string, remember: boolean) {
  endSession();
  writeJson(remember ? local() : session(), SESSION_KEY, { email: normaliseEmail(email) });
  notifySessionChange();
}

export function endSession() {
  try {
    local()?.removeItem(SESSION_KEY);
    session()?.removeItem(SESSION_KEY);
    session()?.removeItem(UNLOCKED_KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
  notifySessionChange();
}

/** Email of the logged-in user, or null. */
export function getSessionEmail(): string | null {
  const saved =
    readJson<{ email: string }>(session(), SESSION_KEY) ??
    readJson<{ email: string }>(local(), SESSION_KEY);
  return saved?.email ?? null;
}

/** Records that the PIN was entered (or just created) in this tab session. */
export function markUnlocked() {
  writeJson(session(), UNLOCKED_KEY, Date.now());
  notifySessionChange();
}

/** Locks the app again (auto-lock): the PIN or fingerprint is needed to continue. */
export function lockSession() {
  try {
    session()?.removeItem(UNLOCKED_KEY);
  } catch {
    // Storage blocked: nothing to clear.
  }
  notifySessionChange();
}

/** When the app was unlocked in this tab, or null if it's locked. */
export function getUnlockedAt(): number | null {
  const value = readJson<number>(session(), UNLOCKED_KEY);
  return typeof value === "number" ? value : null;
}

export function isUnlocked(): boolean {
  return getUnlockedAt() !== null;
}

/* ── Change notifications (so screens re-read the session) ───────────── */

const listeners = new Set<() => void>();

export function subscribeToSession(listener: () => void) {
  listeners.add(listener);
  // Other tabs logging in/out also count.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notifySessionChange() {
  listeners.forEach((listener) => listener());
}

/* ── Shortcuts for the logged-in account ─────────────────────────────── */

/** advanceStep for whoever is logged in (does nothing if nobody is). */
export function advanceSessionStep(step: AccountStep) {
  const email = getSessionEmail();
  if (email) advanceStep(email, step);
}

/** updateAccount for whoever is logged in (does nothing if nobody is). */
export function updateSessionAccount(details: Parameters<typeof updateAccount>[1]) {
  const email = getSessionEmail();
  if (email) updateAccount(email, details);
}

/* ── Remembered devices (skip the log-in 2FA code) ───────────────────── */

/**
 * Accounts that ticked "Remember this device" on THIS browser, with when
 * that expires. In production: a signed, httpOnly device cookie from the
 * server (JavaScript can't read or forge it), checked on every log-in.
 */
const REMEMBERED_DEVICES_KEY = "feenicks1-demo-remembered-devices";

export function rememberThisDevice(email: string, days: number) {
  const devices = readJson<Record<string, number>>(local(), REMEMBERED_DEVICES_KEY) ?? {};
  devices[normaliseEmail(email)] = Date.now() + days * 24 * 60 * 60 * 1000;
  writeJson(local(), REMEMBERED_DEVICES_KEY, devices);
}

export function isDeviceRemembered(email: string): boolean {
  const devices = readJson<Record<string, number>>(local(), REMEMBERED_DEVICES_KEY) ?? {};
  return (devices[normaliseEmail(email)] ?? 0) > Date.now();
}
