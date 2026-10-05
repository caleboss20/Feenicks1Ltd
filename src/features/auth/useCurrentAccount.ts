"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  findAccount,
  getSessionEmail,
  getUnlockedAt,
  subscribeToSession,
} from "@/demo/demoAccounts";
import type { RiskLevel } from "@/features/investor-profile/riskProfileQuestions";
import { isPackageId, type PackageId } from "@/features/packages/investmentPackages";
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
  /** As entered on "Fill Your Profile" (the name on their ID). */
  fullName: string | null;
  firstName: string | null;
  /** Chosen on Edit profile, without the "@"; null until they pick one. */
  username: string | null;
  /** Profile phone: 9 digits, without +233 or the leading 0. */
  phone: string | null;
  /** Profile picture (image URL), if one was added on "Fill Your Profile". */
  avatarUrl: string | null;
  /** Fingerprint / Face ID is set up and can unlock the app. */
  hasBiometrics: boolean;
  /** Investor risk profile, once the questions are answered. */
  riskLevel: RiskLevel | null;
  /**
   * The package they've chosen to invest in (agreed to its terms, at sign-up
   * or later), or null if they haven't chosen. Invest opens it.
   */
  chosenPackageId: PackageId | null;
  step: AccountStep;
  /**
   * They've reached the dashboard at least once: the start-investing journey
   * (shown once after registration) is over; investing happens in the app.
   */
  hasFinishedOnboarding: boolean;
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
 * The package an account has chosen. Saved when terms are agreed to; for
 * accounts from before it was saved, the package of their latest terms
 * acceptance (that's what they chose at sign-up).
 */
function chosenPackageOf(account: ReturnType<typeof findAccount>): PackageId | null {
  const id = account?.chosenPackageId ?? account?.termsAcceptances?.at(-1)?.packageId;
  return id && isPackageId(id) ? id : null;
}

/**
 * Everything the screens react to, as one string
 * ("email|unlockedAt|step|biometrics|risk|avatar|username|onboarded|package"),
 * so React can tell cheaply whether anything changed.
 */
function readSnapshot() {
  const email = getSessionEmail();
  if (!email) return "";
  const account = findAccount(email);
  return [
    email,
    getUnlockedAt() ?? 0,
    account?.step ?? "",
    account?.biometricCredentialId ? 1 : 0,
    account?.riskProfile?.level ?? "",
    // Changes when a picture is added (its length is a cheap fingerprint).
    account?.avatarDataUrl?.length ?? 0,
    account?.username ?? "",
    account?.onboardingFinishedAt ? 1 : 0,
    chosenPackageOf(account) ?? "",
  ].join("|");
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
        fullName: account.fullName ?? null,
        firstName: account.fullName?.split(/\s+/)[0] ?? null,
        username: account.username ?? null,
        phone: account.phone ?? null,
        avatarUrl: account.avatarDataUrl ?? null,
        hasBiometrics: Boolean(account.biometricCredentialId),
        riskLevel: account.riskProfile?.level ?? null,
        chosenPackageId: chosenPackageOf(account),
        step: account.step,
        hasFinishedOnboarding: Boolean(account.onboardingFinishedAt),
        isUnlocked: unlockedAt !== null,
        unlockedAt,
      },
    };
  }, [snapshot]);
}
