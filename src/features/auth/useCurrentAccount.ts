"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  findAccount,
  getSessionEmail,
  getUnlockedAt,
  subscribeToSession,
} from "@/demo/demoAccounts";
import type { AccountStep } from "./accountProgress";

/**
 * The logged-in user, for screens that need to know who's there
 * (Enter PIN, dashboard).
 *
 *   status "loading"     → first render, the browser hasn't been checked yet
 *   status "signed-out"  → nobody logged in → send them to Log in
 *   status "signed-in"   → `account` is available
 *
 * TODO(api): in production read this from GET /api/me (the session lives in
 * an httpOnly cookie). Today it comes from the demo store (src/demo).
 */

export type CurrentAccount = {
  email: string;
  firstName: string | null;
  /** Profile phone: 9 digits, without +233 or the leading 0. */
  phone: string | null;
  /** Fingerprint / Face ID is set up and can unlock the app. */
  hasBiometrics: boolean;
  step: AccountStep;
  /** True once the PIN has been entered (or created) in this session. */
  isUnlocked: boolean;
  /** When it was unlocked (ms timestamp), or null while locked. Used by auto-lock. */
  unlockedAt: number | null;
};

export type CurrentAccountState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; account: CurrentAccount };

/**
 * Everything the screens react to, as one string ("email|unlockedAt|step|biometrics"),
 * so React can tell cheaply whether anything changed.
 */
function readSnapshot() {
  const email = getSessionEmail();
  if (!email) return "";
  const account = findAccount(email);
  return [email, getUnlockedAt() ?? 0, account?.step ?? "", account?.biometricCredentialId ? 1 : 0].join("|");
}

export function useCurrentAccount(): CurrentAccountState {
  // null on the server and during hydration (no browser storage there).
  const snapshot = useSyncExternalStore(subscribeToSession, readSnapshot, () => null);

  return useMemo<CurrentAccountState>(() => {
    if (snapshot === null) return { status: "loading" };
    if (snapshot === "") return { status: "signed-out" };

    const [email, unlockedAtText] = snapshot.split("|");
    const unlockedAt = Number(unlockedAtText) || null;
    const account = findAccount(email);
    if (!account) return { status: "signed-out" };

    return {
      status: "signed-in",
      account: {
        email: account.email,
        firstName: account.fullName?.split(/\s+/)[0] ?? null,
        phone: account.phone ?? null,
        hasBiometrics: Boolean(account.biometricCredentialId),
        step: account.step,
        isUnlocked: unlockedAt !== null,
        unlockedAt,
      },
    };
  }, [snapshot]);
}
