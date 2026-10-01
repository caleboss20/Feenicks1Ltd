"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-lock: locks the app after a few minutes without use, so nobody can
 * pick up an unlocked phone and get into the account. Unlocking needs the
 * PIN (or fingerprint / Face ID) again, then the user is taken back to the
 * exact screen they were on.
 *
 * Locks when EITHER:
 *   - no tap, key, scroll or touch for AUTO_LOCK_AFTER_MS while the app is open
 *   - the user comes back to the app (or reloads it) after being away that long
 *
 * Only runs inside the app (see AppLockGuard), never on sign-up or log-in.
 * In production the server should also expire idle sessions; this lock is
 * the on-device layer, like banking apps.
 */

/** Lock after 5 minutes without any activity. */
export const AUTO_LOCK_AFTER_MS = 5 * 60 * 1000;

/** How often to check while the app is open. */
const CHECK_EVERY_MS = 10_000;

/** Activity is saved at most this often (taps and scrolls fire constantly). */
const SAVE_ACTIVITY_EVERY_MS = 5_000;

/** Last activity time, in sessionStorage so it survives a page reload. */
const LAST_ACTIVE_KEY = "feenicks1-last-active";

/** Where to go back to after unlocking, and why the app was locked. */
const LOCK_CONTEXT_KEY = "feenicks1-lock-context";

export type LockReason = "inactive";
type LockContext = { returnTo: string; reason: LockReason };

/* ── Small, crash-proof sessionStorage helpers ─────────────────────── */

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // Storage blocked: auto-lock still works while the page stays open.
  }
}

/**
 * Only paths inside this app (e.g. "/dashboard"). Never a full URL or
 * "//other-site.com", so a tampered value can't send the user to another site.
 */
function isSafeAppPath(path: unknown): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

/* ── Lock context: "where were they, and why did we lock" ──────────── */

export function saveLockContext(context: LockContext) {
  write(LOCK_CONTEXT_KEY, JSON.stringify(context));
}

/** Reads the lock context without removing it (e.g. to show "Locked after 5 minutes"). */
export function peekLockContext(): LockContext | null {
  if (typeof window === "undefined") return null;
  try {
    const context = JSON.parse(read(LOCK_CONTEXT_KEY) ?? "null") as LockContext | null;
    return context && isSafeAppPath(context.returnTo) ? context : null;
  } catch {
    return null;
  }
}

/** Where to go after unlocking (and forgets it), or `fallback` if nothing was saved. */
export function takeReturnPath(fallback: string): string {
  const context = peekLockContext();
  write(LOCK_CONTEXT_KEY, null);
  return context?.returnTo ?? fallback;
}

export function clearLockContext() {
  write(LOCK_CONTEXT_KEY, null);
}

/* ── The idle timer ─────────────────────────────────────────────────── */

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

/**
 * Calls `onLock` once the user has been inactive for AUTO_LOCK_AFTER_MS.
 *
 * @param enabled    only while the app is unlocked and on screen
 * @param unlockedAt when the PIN was entered: counts as activity, so an old
 *                   timestamp from before the last lock can't re-lock instantly
 */
export function useAutoLock({
  enabled,
  unlockedAt,
  onLock,
}: {
  enabled: boolean;
  unlockedAt: number | null;
  onLock: () => void;
}) {
  // Always call the latest onLock without restarting the timers.
  const onLockRef = useRef(onLock);
  useEffect(() => {
    onLockRef.current = onLock;
  });

  useEffect(() => {
    if (!enabled) return;

    let lastSaved = 0;
    let hasLocked = false;

    const lastActive = () => Math.max(Number(read(LAST_ACTIVE_KEY)) || 0, unlockedAt ?? 0);

    const recordActivity = () => {
      const now = Date.now();
      if (now - lastSaved < SAVE_ACTIVITY_EVERY_MS) return;
      lastSaved = now;
      write(LAST_ACTIVE_KEY, String(now));
    };

    const checkIdle = () => {
      if (hasLocked || Date.now() - lastActive() < AUTO_LOCK_AFTER_MS) return;
      hasLocked = true;
      write(LAST_ACTIVE_KEY, null);
      onLockRef.current();
    };

    // Back from another app or tab: check straight away, before they see anything.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkIdle();
    };

    checkIdle(); // e.g. the page was reloaded after a long break
    const timer = window.setInterval(checkIdle, CHECK_EVERY_MS);
    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, recordActivity, { passive: true, capture: true }),
    );
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((name) =>
        window.removeEventListener(name, recordActivity, { capture: true }),
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, unlockedAt]);
}
