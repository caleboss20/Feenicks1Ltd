/**
 * "Add Feenicks1 to your home screen": whether we can offer it, and how.
 *
 *   mode "prompt" → Android / Chrome / Edge: the browser gave us an install
 *                   prompt (beforeinstallprompt); our Install button opens it
 *   mode "ios"    → iPhone / iPad: browsers there have no install prompt, so
 *                   we explain Share › Add to Home Screen
 *   mode "none"   → already installed (opened from the home screen), not
 *                   supported, or not known yet (server render)
 *
 * The browser fires beforeinstallprompt once, often before any screen that
 * offers installing is open, so it is caught here at module load (this file
 * is imported by the root layout's InstallPromptListener) and kept.
 *
 * Dismissing the offer hides it for 30 days (this device only: localStorage,
 * a per-device convenience; nothing breaks if storage is blocked).
 */

/** The non-standard event Chromium browsers send when the app is installable. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallMode = "prompt" | "ios" | "none";
export type InstallSnapshot = { mode: InstallMode; dismissed: boolean };

const DISMISSED_KEY = "feenicks1-install-dismissed-at";
const HIDE_FOR_MS = 30 * 24 * 60 * 60 * 1000;

const SERVER_SNAPSHOT: InstallSnapshot = { mode: "none", dismissed: true };

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let snapshot: InstallSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag for "opened from the home screen".
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  // iPadOS reports itself as a Mac, so check for touch too.
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

function wasDismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < HIDE_FOR_MS;
  } catch {
    return false;
  }
}

/** Recomputes the snapshot (a new object only when something changed). */
function refresh() {
  const mode: InstallMode =
    installed || isStandalone() ? "none" : deferredPrompt ? "prompt" : isIos() ? "ios" : "none";
  const dismissed = wasDismissedRecently();
  if (mode !== snapshot.mode || dismissed !== snapshot.dismissed) {
    snapshot = { mode, dismissed };
    listeners.forEach((listener) => listener());
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep the browser's own mini-bar quiet; we offer it at a calmer moment.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    refresh();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    refresh();
  });
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  refresh();
  return () => listeners.delete(listener);
}

export function getInstallSnapshot() {
  return snapshot;
}

export function getServerInstallSnapshot() {
  return SERVER_SNAPSHOT;
}

/** Opens the browser's install dialog (mode "prompt" only). */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  const event = deferredPrompt;
  deferredPrompt = null; // each prompt can be used once
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") installed = true;
  refresh();
  return outcome;
}

/** Hides the offer on this device for 30 days. */
export function dismissInstall() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // Storage blocked: it simply shows again next time.
  }
  snapshot = { ...snapshot, dismissed: true };
  listeners.forEach((listener) => listener());
}
