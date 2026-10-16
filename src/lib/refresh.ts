/**
 * "Refresh now": a tiny app-wide signal, sent by pull-to-refresh and heard by
 * the data hooks (transactions, notifications), which reload when it fires.
 *
 * Demo: data lives on the device, so a reload is instant. With the real API
 * the same hooks refetch from the server here.
 */

const EVENT = "feenicks1:refresh";

/** Ask every listening data hook to reload. */
export function requestRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/** Calls `listener` on every refresh request; returns the unsubscribe. */
export function subscribeToRefresh(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
