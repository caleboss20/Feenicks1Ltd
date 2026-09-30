import { create } from "zustand";

/**
 * Sign-up progress (Zustand): carries the new account's email from the
 * sign-up form to the "Verify Email" screen, so that screen can say where
 * the code went and re-send it.
 *
 * Kept in memory only (not localStorage). If the page is refreshed on the
 * verify screen, the user is sent back to sign up.
 */

type SignUpState = {
  /** Email of the account being created; empty until sign-up succeeds. */
  email: string;
  saveEmail: (email: string) => void;
  clear: () => void;
};

export const useSignUpStore = create<SignUpState>()((set) => ({
  email: "",
  saveEmail: (email) => set({ email }),
  clear: () => set({ email: "" }),
}));
