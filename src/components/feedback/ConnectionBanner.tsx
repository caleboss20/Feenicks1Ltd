"use client";

/**
 * The connection banner, on every screen: when the phone loses its
 * connection, a calm strip slides down from the top ("You're offline…");
 * when it comes back, "Back online" shows briefly and the strip goes.
 * Announced to screen readers (role="status"). Nothing shows while online.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type State = "online" | "offline" | "back";

export function ConnectionBanner() {
  const [state, setState] = useState<State>("online");

  useEffect(() => {
    let timer: number | undefined;
    const goOffline = () => {
      window.clearTimeout(timer);
      setState("offline");
    };
    const goOnline = () => {
      setState((current) => (current === "offline" ? "back" : "online"));
      timer = window.setTimeout(() => setState("online"), 2500);
    };
    if (!navigator.onLine) timer = window.setTimeout(goOffline, 0);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))] transition-transform duration-300 motion-reduce:transition-none",
        state === "online" ? "-translate-y-full" : "translate-y-0",
      )}
    >
      {state !== "online" && (
        <p
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white",
            state === "offline" ? "bg-neutral-900 dark:bg-neutral-700" : "bg-brand-600",
          )}
        >
          <span aria-hidden className={cn("size-2 rounded-full", state === "offline" ? "bg-amber-400" : "bg-white")} />
          {state === "offline" ? "You're offline. Payments and withdrawals need a connection." : "Back online"}
        </p>
      )}
    </div>
  );
}
