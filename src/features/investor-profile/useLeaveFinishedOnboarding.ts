"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";

/**
 * For the start-investing (onboarding) screens: once the user has finished
 * onboarding (reached the dashboard), send them to the in-app version of the
 * screen instead, e.g. when the phone's Back button returns to a sign-up
 * screen. So a registered user never lands back in the sign-up journey.
 *
 * Returns true while sending them away, so the screen can show nothing
 * meanwhile (no flash of the onboarding screen).
 *
 * @param appRoute  where the same thing lives in the app, e.g. ROUTES.invest
 * @param isOnboardingScreen  false when the screen is already the in-app version
 */
export function useLeaveFinishedOnboarding(appRoute: string, isOnboardingScreen = true): boolean {
  const router = useRouter();
  const current = useCurrentAccount();
  const shouldLeave =
    isOnboardingScreen && current.status === "signed-in" && current.account.hasFinishedOnboarding;

  useEffect(() => {
    if (shouldLeave) router.replace(appRoute);
  }, [shouldLeave, appRoute, router]);

  return shouldLeave;
}
