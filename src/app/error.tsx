"use client";

import Link from "next/link";
import { useEffect } from "react";
import { STATUS_PRIMARY, STATUS_SECONDARY, StatusScreen } from "@/components/feedback/StatusScreen";
import { ROUTES } from "@/config/routes";

/**
 * Shown when any screen fails to load (Next's error boundary): a calm
 * message, "Try again" (re-renders the screen) and a way home. The
 * technical error never reaches the investor; its short digest is shown as
 * a reference for support. TODO(api): report errors to monitoring.
 */
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      icon="error"
      title="Something went wrong"
      message="We couldn't load this screen. Your money and your account are safe. Please try again."
      primary={
        <button type="button" onClick={reset} className={STATUS_PRIMARY}>
          Try again
        </button>
      }
      secondary={
        <Link href={ROUTES.dashboard} className={STATUS_SECONDARY}>
          Go to Home
        </Link>
      }
      reference={error.digest?.slice(0, 10)}
    />
  );
}
