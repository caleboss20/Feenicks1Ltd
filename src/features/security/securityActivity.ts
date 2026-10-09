import { IS_DEMO_MODE } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import { describeThisDevice } from "@/lib/device";

/**
 * Security activity for the Security centre: the devices signed in to the
 * account, and a log of security events (log-ins, PIN changes, fingerprint
 * / Face ID on or off, two-step log-in turned on, other devices signed out).
 *
 * Each browser gets a random device ID (kept on the device), so "This
 * device" can be told apart from others. Events are recorded where they
 * happen (authService, securityService) and kept newest first.
 * TODO(api): GET /api/security/sessions and /api/security/events — the
 * server records these (with IP-based approximate location) and signing
 * out other devices revokes their sessions.
 */

export type SecurityEventKind =
  | "log-in"
  | "pin-changed"
  | "biometric-on"
  | "biometric-off"
  | "two-factor-on"
  | "signed-out-others";

export type SecurityEvent = { id: string; kind: SecurityEventKind; at: string; device: string; deviceId: string };

export type KnownDevice = { id: string; name: string; firstSeen: string; lastSeen: string };

const DEVICE_KEY = "feenicks1-device-id";
const MAX_EVENTS = 30;

export const SECURITY_EVENT_TITLES: Record<SecurityEventKind, string> = {
  "log-in": "Logged in",
  "pin-changed": "PIN changed",
  "biometric-on": "Fingerprint / Face ID turned on",
  "biometric-off": "Fingerprint / Face ID turned off",
  "two-factor-on": "Two-step log-in turned on",
  "signed-out-others": "Signed out of other devices",
};

const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => byte.toString(16).padStart(2, "0")).join("");

/** This browser's device ID (made once, kept on the device). */
export function thisDeviceId(): string {
  try {
    const saved = window.localStorage.getItem(DEVICE_KEY);
    if (saved) return saved;
    const id = randomId();
    window.localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return "this-device";
  }
}

/** Marks this device as active on the account now (added to the list if new). */
export function touchThisDevice(email: string): void {
  if (!IS_DEMO_MODE || typeof window === "undefined") return;
  const account = demo.findAccount(email);
  if (!account) return;
  const id = thisDeviceId();
  const now = new Date().toISOString();
  const devices = account.devices ?? [];
  const known = devices.find((device) => device.id === id);
  demo.updateAccount(email, {
    devices: known
      ? devices.map((device) => (device.id === id ? { ...device, name: describeThisDevice(), lastSeen: now } : device))
      : [...devices, { id, name: describeThisDevice(), firstSeen: now, lastSeen: now }],
  });
}

/** Adds an event to the account's security activity (and marks this device active). */
export function recordSecurityEvent(email: string, kind: SecurityEventKind): void {
  if (!IS_DEMO_MODE || typeof window === "undefined") return;
  touchThisDevice(email);
  const account = demo.findAccount(email);
  if (!account) return;
  const event: SecurityEvent = {
    id: randomId(),
    kind,
    at: new Date().toISOString(),
    device: describeThisDevice(),
    deviceId: thisDeviceId(),
  };
  demo.updateAccount(email, { securityEvents: [event, ...(account.securityEvents ?? [])].slice(0, MAX_EVENTS) });
}

/** Signs every other device out, leaving this one. TODO(api): revoke their sessions on the server. */
export function signOutOtherDevices(email: string): void {
  if (!IS_DEMO_MODE) return;
  const account = demo.findAccount(email);
  if (!account) return;
  const id = thisDeviceId();
  demo.updateAccount(email, { devices: (account.devices ?? []).filter((device) => device.id === id) });
  recordSecurityEvent(email, "signed-out-others");
}

export function getSecurityActivity(email: string): { devices: KnownDevice[]; events: SecurityEvent[] } {
  const account = IS_DEMO_MODE ? demo.findAccount(email) : null;
  const devices = [...(account?.devices ?? [])].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  return { devices, events: account?.securityEvents ?? [] };
}
