import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Global app store (Zustand).
 *
 * Holds app-level UI state that should survive a page refresh, such as
 * whether the user has already been through onboarding. It is persisted
 * to `localStorage` under the key below.
 *
 * Usage in a Client Component:
 *   const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
 *
 * Usage outside React (event handlers, timers):
 *   useAppStore.getState().completeOnboarding();
 *
 * ⚠️ Never store secrets or auth tokens here. localStorage can be read by
 * any script on the page. Auth will use secure httpOnly cookies.
 */

type AppState = {
  /** True once the user has finished (or skipped) the onboarding slides. */
  hasCompletedOnboarding: boolean;
};

type AppActions = {
  completeOnboarding: () => void;
  /** Clears persisted app state, e.g. on logout or for testing onboarding again. */
  reset: () => void;
};

export type AppStore = AppState & AppActions;

const initialState: AppState = {
  hasCompletedOnboarding: false,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      reset: () => set(initialState),
    }),
    {
      name: "feenicks1-app", // localStorage key
      version: 1, // bump when the persisted shape changes, and add a `migrate`
      storage: createJSONStorage(() => localStorage),
      // Persist data only, never functions.
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);
