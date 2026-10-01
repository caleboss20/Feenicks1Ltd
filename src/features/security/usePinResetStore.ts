import { create } from "zustand";

/**
 * Forgot-PIN progress (Zustand): carries the one-time reset token from the
 * "Confirmation code" screen to the "Create New PIN" screen.
 *
 * Memory only (never localStorage): the token is a short-lived secret. After
 * a page refresh it's gone and the user simply starts the reset again.
 */

type PinResetState = {
  resetToken: string | null;
  saveResetToken: (token: string) => void;
  clear: () => void;
};

export const usePinResetStore = create<PinResetState>()((set) => ({
  resetToken: null,
  saveResetToken: (resetToken) => set({ resetToken }),
  clear: () => set({ resetToken: null }),
}));
