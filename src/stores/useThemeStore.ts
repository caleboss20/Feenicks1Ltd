import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { THEME_STORAGE_KEY, type Theme } from "@/config/theme";
import {
  DEFAULT_DASHBOARD_COLOR,
  type CustomColor,
  type DashboardColorId,
} from "@/features/dashboard/dashboardTheme";
import { DEFAULT_HIDDEN_BALANCE_STYLE, type HiddenBalanceStyle } from "@/features/dashboard/hiddenBalance";

/** How many colours "+" keeps (newest first; the oldest drops off). */
const MAX_SAVED_COLORS = 8;

const sameColor = (a: CustomColor, b: CustomColor) =>
  a.hue === b.hue && a.saturation === b.saturation && a.brightness === b.brightness;

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
  /**
   * The colour of the dashboard's top area (Account › Dashboard colour),
   * green by default. Saved on this device with the theme. An id that's no
   * longer offered falls back to green when read (dashboardColor()).
   */
  dashboardColor: DashboardColorId;
  /** Picks a preset (and drops any colour-wheel colour). */
  setDashboardColor: (id: DashboardColorId) => void;
  /** A colour picked on the colour wheel; when set, it's used instead of the preset. */
  customDashboardColor: CustomColor | null;
  setCustomDashboardColor: (color: CustomColor) => void;
  /** Colours kept with "+" on the picker, newest first (up to 8). */
  savedDashboardColors: CustomColor[];
  saveDashboardColor: (color: CustomColor) => void;
  /** Back to the default (green): the picker's "Reset". */
  resetDashboardColor: () => void;
  /** How a hidden balance looks on the dashboard (Account › Hidden balance): dots by default. */
  hiddenBalanceStyle: HiddenBalanceStyle;
  setHiddenBalanceStyle: (style: HiddenBalanceStyle) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      dashboardColor: DEFAULT_DASHBOARD_COLOR,
      setDashboardColor: (dashboardColor) => set({ dashboardColor, customDashboardColor: null }),
      customDashboardColor: null,
      setCustomDashboardColor: (customDashboardColor) => set({ customDashboardColor }),
      savedDashboardColors: [],
      saveDashboardColor: (color) =>
        set((state) => ({
          savedDashboardColors: [
            color,
            ...state.savedDashboardColors.filter((saved) => !sameColor(saved, color)),
          ].slice(0, MAX_SAVED_COLORS),
        })),
      resetDashboardColor: () =>
        set({ dashboardColor: DEFAULT_DASHBOARD_COLOR, customDashboardColor: null }),
      hiddenBalanceStyle: DEFAULT_HIDDEN_BALANCE_STYLE,
      setHiddenBalanceStyle: (hiddenBalanceStyle) => set({ hiddenBalanceStyle }),
    }),
    {
      name: THEME_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Saved before these existed? They're simply missing and take their defaults.
      partialize: (state) => ({
        theme: state.theme,
        dashboardColor: state.dashboardColor,
        customDashboardColor: state.customDashboardColor,
        savedDashboardColors: state.savedDashboardColors,
        hiddenBalanceStyle: state.hiddenBalanceStyle,
      }),
    },
  ),
);
