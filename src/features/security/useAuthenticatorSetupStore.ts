import { create } from "zustand";
import type { AuthenticatorSetup } from "./securityService";

/**
 * Authenticator-app setup in progress (Zustand): carries the new secret
 * from the QR code screen to the "Confirmation code" screen.
 *
 * Memory only (never localStorage): it's a secret. After a refresh it's
 * gone, and the QR screen simply creates a new one.
 */

type AuthenticatorSetupState = {
  setup: AuthenticatorSetup | null;
  saveSetup: (setup: AuthenticatorSetup) => void;
  clear: () => void;
};

export const useAuthenticatorSetupStore = create<AuthenticatorSetupState>()((set) => ({
  setup: null,
  saveSetup: (setup) => set({ setup }),
  clear: () => set({ setup: null }),
}));
