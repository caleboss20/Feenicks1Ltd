"use client";

/**
 * AppLockGuard: wraps every screen inside the app (dashboard now; portfolio,
 * deposits, withdrawals… later) via the `(app)` layout.
 *
 * 1. Access: only logged-in users who finished registration AND entered
 *    their PIN (or fingerprint) this session. Anyone else is sent to Log in,
 *    to the registration step they reached, or to Enter PIN.
 * 2. Auto-lock: after AUTO_LOCK_AFTER_MS without activity the app locks and
 *    goes to Enter PIN, remembering the current screen so unlocking returns
 *    there (see appLock.ts).
 *
 * Renders nothing until access is confirmed, so private data never flashes.
 * (In production the server must enforce access too.)
 */

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { getRouteForStep } from "@/features/auth/accountProgress";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { saveLockContext, useAutoLock } from "./appLock";
import { lockApp } from "./securityService";

export function AppLockGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useCurrentAccount();

  const redirect =
    current.status === "signed-out"
      ? ROUTES.login
      : current.status === "signed-in" && current.account.step !== "complete"
        ? getRouteForStep(current.account.step)
        : current.status === "signed-in" && !current.account.isUnlocked
          ? ROUTES.enterPin
          : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  // Remember where they were, then lock: `redirect` above moves to Enter PIN.
  const lock = useCallback(() => {
    saveLockContext({ returnTo: pathname, reason: "inactive" });
    void lockApp();
  }, [pathname]);

  const isInApp = current.status === "signed-in" && !redirect;
  useAutoLock({
    enabled: isInApp,
    unlockedAt: current.status === "signed-in" ? current.account.unlockedAt : null,
    onLock: lock,
  });

  if (!isInApp) return null;
  return children;
}
