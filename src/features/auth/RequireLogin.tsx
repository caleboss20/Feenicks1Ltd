"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "./useCurrentAccount";

/**
 * RequireLogin: wraps screens that only make sense for a logged-in user
 * (identity verification, PIN, 2FA). Anyone not logged in is sent to Log in
 * straight away, instead of filling in a step that can't be saved and being
 * bounced halfway through.
 *
 * Renders nothing while the login is being checked (a split second), so
 * private content never flashes on screen.
 *
 * Used by the `/kyc` and `/security` layouts. In production the server must
 * enforce this too (a client-side check alone can be bypassed).
 */
export function RequireLogin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useCurrentAccount();

  useEffect(() => {
    if (status === "signed-out") router.replace(ROUTES.login);
  }, [status, router]);

  if (status !== "signed-in") return null;
  return children;
}
