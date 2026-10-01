import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthenticatorSetup } from "./securityService";

/**
 * Authenticator-app setup in progress (Zustand): the new secret, shared by
 * the QR code screen and the "Confirmation code" screen.
 *
 * Kept in sessionStorage (this tab only), NOT just memory: on phones the
 * user leaves the browser to open Google Authenticator, and the phone often
 * reloads the tab meanwhile. Without this, a reload created a NEW secret,
 * so the code from the app (made from the first secret) never matched.
 *
 * Cleared as soon as setup is confirmed, and gone when the tab closes.
 * (In production the pending secret lives on the server instead.)
 */

type AuthenticatorSetupState = {
  setup: AuthenticatorSetup | null;
  saveSetup: (setup: AuthenticatorSetup) => void;
  clear: () => void;
};

export const useAuthenticatorSetupStore = create<AuthenticatorSetupState>()(
  persist(
    (set) => ({
      setup: null,
      saveSetup: (setup) => set({ setup }),
      clear: () => set({ setup: null }),
    }),
    {
      name: "feenicks1-authenticator-setup",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ setup: state.setup }),
    },
  ),
);
