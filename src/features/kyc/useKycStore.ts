import { create } from "zustand";
import {
  DEFAULT_NATIONALITY,
  type CountryCode,
  type IdentityDocumentId,
} from "./identityDocuments";
import type { InvestmentGoalId } from "./investmentGoals";

/**
 * Identity-verification (KYC) progress (Zustand), shared by the KYC steps.
 * Each step saves its answers here as the user moves through the flow.
 *
 * Kept in memory only: KYC data is personal and sensitive, so it's never
 * written to browser storage. It's sent to the server by `kycService`.
 */

type KycState = {
  /** Answers to "Why are you investing?" (empty if skipped). */
  investmentGoals: InvestmentGoalId[];
  /** Chosen on "Proof of Residency". */
  nationality: CountryCode;
  /** Which ID document the user will photograph next. */
  identityDocument: IdentityDocumentId | null;
};

type KycActions = {
  saveInvestmentGoals: (goals: InvestmentGoalId[]) => void;
  saveResidency: (nationality: CountryCode, identityDocument: IdentityDocumentId) => void;
  /** Forget everything, e.g. once verification is submitted. */
  clear: () => void;
};

const initialState: KycState = {
  investmentGoals: [],
  nationality: DEFAULT_NATIONALITY,
  identityDocument: null,
};

export const useKycStore = create<KycState & KycActions>()((set) => ({
  ...initialState,
  saveInvestmentGoals: (investmentGoals) => set({ investmentGoals }),
  saveResidency: (nationality, identityDocument) => set({ nationality, identityDocument }),
  clear: () => set(initialState),
}));
