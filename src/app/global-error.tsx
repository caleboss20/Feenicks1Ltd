"use client";

import "./globals.css";
import { STATUS_PRIMARY, StatusScreen } from "@/components/feedback/StatusScreen";

/**
 * The last safety net: if the app's own frame fails, this replaces the
 * whole page (it brings its own <html>), so there's never a blank screen.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <StatusScreen
          icon="error"
          title="Something went wrong"
          message="Feenicks1 couldn't start properly. Your money and your account are safe. Please try again."
          primary={
            <button type="button" onClick={reset} className={STATUS_PRIMARY}>
              Try again
            </button>
          }
          reference={error.digest?.slice(0, 10)}
        />
      </body>
    </html>
  );
}
