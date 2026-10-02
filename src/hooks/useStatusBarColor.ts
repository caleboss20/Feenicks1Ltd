"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/useThemeStore";

/**
 * The phone's status bar colour (theme-color) for a screen, in light and dark
 * mode. The page's `viewport` export sets the light colour on the server;
 * this switches to `dark` while dark mode is on, and back when it's off.
 * (On leaving the screen, the next page sets its own colour.)
 */
export function useStatusBarColor({ light, dark }: { light: string; dark: string }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? dark : light;
  }, [theme, light, dark]);
}
