import { create } from "zustand";
import type { ResetMethod } from "./passwordResetValidation";

/**
 * Forgot-password progress (Zustand), shared by the three steps:
 *
 *   step 1 saves  → method + contact   (e.g. "sms", "+234 801 234 5678")
 *   step 2 saves  → resetToken         (after the code is verified)
 *   step 3 uses   → resetToken to save the new password, then clears everything
 *
 * Deliberately NOT saved to localStorage: reset details are sensitive and
 * short-lived. If the page is refreshed mid-flow, the user simply starts
 * again from step 1 (each step redirects there if its data is missing).
 */

type ForgotPasswordState = {
  method: ResetMethod | null;
  contact: string;
  /** Proof from the server that the code was correct; required for step 3. */
  resetToken: string | null;
};

type ForgotPasswordActions = {
  saveContactDetails: (method: ResetMethod, contact: string) => void;
  saveResetToken: (resetToken: string) => void;
  /** Forget everything, e.g. once the new password is saved. */
  clear: () => void;
};

const initialState: ForgotPasswordState = {
  method: null,
  contact: "",
  resetToken: null,
};

export const useForgotPasswordStore = create<ForgotPasswordState & ForgotPasswordActions>()(
  (set) => ({
    ...initialState,
    saveContactDetails: (method, contact) => set({ method, contact, resetToken: null }),
    saveResetToken: (resetToken) => set({ resetToken }),
    clear: () => set(initialState),
  }),
);
