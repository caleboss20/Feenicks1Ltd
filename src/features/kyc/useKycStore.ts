import { create } from "zustand";
import {
  DEFAULT_NATIONALITY,
  type CountryCode,
  type DocumentSide,
  type IdentityDocumentId,
} from "./identityDocuments";
import type { InvestmentGoalId } from "./investmentGoals";
import type { ProfileValues } from "./profileValidation";

/**
 * Identity-verification (KYC) progress (Zustand), shared by the KYC steps.
 * Each step saves its answers here as the user moves through the flow.
 *
 * Kept in memory only: KYC data is personal and sensitive, so it's never
 * written to browser storage. It's sent to the server by `kycService`.
 *
 * Photos: the store OWNS the photos (ID sides and selfie) and their preview
 * URLs, and frees them when they're replaced or on `clear()`. Screens can
 * show a photo with `<img src={photo.url}>` but must not revoke it themselves.
 */

/** A photo taken during KYC, plus an in-memory URL to preview it. */
export type CapturedPhoto = {
  file: Blob;
  /** `blob:` URL for <img src>. Owned and freed by this store. */
  url: string;
};

type KycState = {
  /** Answers to "Why are you investing?" (empty if skipped). */
  investmentGoals: InvestmentGoalId[];
  /** Chosen on "Proof of Residency". */
  nationality: CountryCode;
  /** Which ID document the user is verifying with. */
  identityDocument: IdentityDocumentId | null;
  /** Verified photos of the ID document, by side (front / back / passport photo page). */
  idPhotos: Partial<Record<DocumentSide["id"], CapturedPhoto>>;
  /** The selfie that matched the ID. */
  selfie: CapturedPhoto | null;
  /** Saved on "Fill Your Profile" (e.g. to greet the user by name). */
  profile: ProfileValues | null;
};

type KycActions = {
  saveInvestmentGoals: (goals: InvestmentGoalId[]) => void;
  saveResidency: (nationality: CountryCode, identityDocument: IdentityDocumentId) => void;
  saveIdPhoto: (side: DocumentSide["id"], photo: CapturedPhoto) => void;
  saveSelfie: (photo: CapturedPhoto) => void;
  saveProfile: (profile: ProfileValues) => void;
  /** Forget everything (and free the photos), e.g. once verification is submitted. */
  clear: () => void;
};

const initialState: KycState = {
  investmentGoals: [],
  nationality: DEFAULT_NATIONALITY,
  identityDocument: null,
  idPhotos: {},
  selfie: null,
  profile: null,
};

/** Frees a photo's preview URL from memory. */
const release = (photo?: CapturedPhoto | null) => {
  if (photo) URL.revokeObjectURL(photo.url);
};

export const useKycStore = create<KycState & KycActions>()((set, get) => ({
  ...initialState,

  saveInvestmentGoals: (investmentGoals) => set({ investmentGoals }),

  saveResidency: (nationality, identityDocument) => {
    // A different document makes earlier photos useless: forget them.
    if (identityDocument !== get().identityDocument) {
      Object.values(get().idPhotos).forEach(release);
      release(get().selfie);
      set({ idPhotos: {}, selfie: null });
    }
    set({ nationality, identityDocument });
  },

  saveIdPhoto: (side, photo) => {
    release(get().idPhotos[side]); // replacing a side frees the old photo
    set({ idPhotos: { ...get().idPhotos, [side]: photo } });
  },

  saveSelfie: (photo) => {
    release(get().selfie);
    set({ selfie: photo });
  },

  saveProfile: (profile) => set({ profile }),

  clear: () => {
    Object.values(get().idPhotos).forEach(release);
    release(get().selfie);
    set(initialState);
  },
}));
