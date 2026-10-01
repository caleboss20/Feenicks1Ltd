import { create } from "zustand";
import type { LoginChallenge } from "./authService";

/**
 * A log-in waiting for its 2FA code (Zustand): carries the pending
 * challenge from the Log in form to the "Two-step verification" screen.
 *
 * Memory only (never localStorage): it's short-lived and security-sensitive.
 * After a refresh it's gone and the user simply logs in again.
 */

type LoginChallengeState = {
  challenge: LoginChallenge | null;
  saveChallenge: (challenge: LoginChallenge) => void;
  clear: () => void;
};

export const useLoginChallengeStore = create<LoginChallengeState>()((set) => ({
  challenge: null,
  saveChallenge: (challenge) => set({ challenge }),
  clear: () => set({ challenge: null }),
}));
