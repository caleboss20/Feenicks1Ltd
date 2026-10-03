"use client";

import { useEffect } from "react";

/** How dark modal backdrops are (black at 40%): keep in sync with `backdrop:bg-black/40`. */
export const MODAL_BACKDROP_OPACITY = 0.4;

/**
 * Set on <html> (data-modals="1", "2"…) while modals are open, so the status
 * bar colour (useStatusBarColor) keeps the dimmed colour instead of putting
 * the screen's own back.
 */
export const OPEN_MODALS_ATTRIBUTE = "data-modals";

/** "#0f8249" as seen through the backdrop → "#094e2c". Other formats come back unchanged. */
export function dimHexColor(color: string): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return color;
  const channels = hex.match(/../g) ?? [];
  return `#${channels
    .map((channel) =>
      Math.round(parseInt(channel, 16) * (1 - MODAL_BACKDROP_OPACITY))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/**
 * While a modal (dialog or sheet) is open: the page behind can't scroll, and
 * the phone's status bar (theme-color) is dimmed like the page under the
 * backdrop, so the two still read as one surface. Both are put back on close.
 */
export function useModalBackdropEffects(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    // Counted, in case one modal opens over another.
    const openModals = () => Number(root.getAttribute(OPEN_MODALS_ATTRIBUTE) ?? 0);
    root.setAttribute(OPEN_MODALS_ATTRIBUTE, String(openModals() + 1));

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = meta?.content;
    if (meta && previousThemeColor) meta.content = dimHexColor(previousThemeColor);

    return () => {
      root.style.overflow = previousOverflow;
      const stillOpen = openModals() - 1;
      if (stillOpen > 0) root.setAttribute(OPEN_MODALS_ATTRIBUTE, String(stillOpen));
      else root.removeAttribute(OPEN_MODALS_ATTRIBUTE);
      if (meta && previousThemeColor) meta.content = previousThemeColor;
    };
  }, [isOpen]);
}
