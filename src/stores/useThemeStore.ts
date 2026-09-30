import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { THEME_STORAGE_KEY, type Theme } from "@/config/theme";

/**
 * Theme store (Zustand): light / dark appearance.
 *
 * Product rule: the app is ALWAYS light (pure white) by default, whatever
 * the device's own dark-mode setting. Dark mode is only used when the user
 * explicitly turns it on in Settings.
 *
 * How it works:
 *   1. The choice is persisted to localStorage (THEME_STORAGE_KEY).
 *   2. On page load, `themeInitScript` (in the root layout) reads it and adds
 *      the `dark` class to <html> BEFORE the first paint, so there's no flash.
 *   3. When the user changes it, `setTheme` updates the class immediately.
 *   4. Tailwind's `dark:` variant is tied to that class (see globals.css).
 *
 * Settings toggle usage (to build later):
 *   const theme = useThemeStore((s) => s.theme);
 *   const setTheme = useThemeStore((s) => s.setTheme);
 *   <Switch checked={theme === "dark"} onChange={(on) => setTheme(on ? "dark" : "light")} />
 *
 * Kept separate from useAppStore so resetting app data (e.g. on logout)
 * never resets the user's appearance preference.
 */

/** Adds/removes the `dark` class on <html>, which drives all `dark:` styles. */
function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

type ThemeStore = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
