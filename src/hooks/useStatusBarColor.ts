"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/useThemeStore";
import { dimHexColor, OPEN_MODALS_ATTRIBUTE } from "./useModalBackdropEffects";

/**
 * The phone's status bar colour (theme-color) for a screen, in light and dark
 * mode. The page's `viewport` export sets a colour on the server; this sets
 * the screen's own once it's in the browser (dark while dark mode is on; on
 * Home, the user's chosen dashboard colour), and keeps it there.
 *
 * "Keeps it": Next.js may rewrite the theme-color tag after the screen has
 * set it (when a page's head arrives after it rendered, e.g. on navigating
 * between screens), which put Home's status bar back to the default green.
 * So while the screen is open, any change to the tag is put back to the
 * screen's colour (dimmed while a modal is open: useModalBackdropEffects).
 * On leaving, the next screen sets its own.
 */
export function useStatusBarColor({ light, dark }: { light: string; dark: string }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const apply = () => {
      const screenColor = theme === "dark" ? dark : light;
      const color = document.documentElement.hasAttribute(OPEN_MODALS_ATTRIBUTE)
        ? dimHexColor(screenColor)
        : screenColor;
      const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
      if (metas.length === 0) {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = color;
        document.head.appendChild(meta);
        return;
      }
      // Only when different, so this doesn't trigger itself forever.
      metas.forEach((meta) => {
        if (meta.content !== color) meta.content = color;
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["content"],
    });
    // A modal opening or closing changes which colour is right.
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [OPEN_MODALS_ATTRIBUTE] });
    return () => observer.disconnect();
  }, [theme, light, dark]);
}
