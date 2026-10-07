"use client";

import { useState } from "react";

/**
 * "Hide amounts" (the eye): one setting for the wallet card, Withdraw and
 * the dashboard (DashboardScreen reads the same key, and also hides amounts
 * when the app goes to the background). A convenience on this device, not
 * security.
 */
const HIDE_AMOUNTS_KEY = "feenicks1-hide-amounts";

function readHideAmounts(): boolean {
  try {
    return window.localStorage.getItem(HIDE_AMOUNTS_KEY) === "1";
  } catch {
    return false;
  }
}

/** [hidden, toggle]: whether amounts are hidden, and a toggle that remembers the choice. */
export function useHideAmounts(): [boolean, () => void] {
  const [hidden, setHidden] = useState(readHideAmounts);
  const toggle = () =>
    setHidden((wasHidden) => {
      try {
        window.localStorage.setItem(HIDE_AMOUNTS_KEY, wasHidden ? "0" : "1");
      } catch {
        // Storage blocked: it just won't be remembered.
      }
      return !wasHidden;
    });
  return [hidden, toggle];
}
