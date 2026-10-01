import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import type { CountryCode, DocumentSide, IdentityDocumentId } from "./identityDocuments";
import type { InvestmentGoalId } from "./investmentGoals";
import type { ProfileValues } from "./profileValidation";

/**
 * KYC service: the single place the identity-verification screens talk to
 * the server. Screens never `fetch` directly.
 *
 * In DEMO MODE (see config/demoMode.ts) every call succeeds, and the
 * account's progress is saved in this browser (src/demo) so a user who
 * logs out can carry on where they left off. The real server records
 * progress itself as it receives each step.
 */

export type KycResult = { ok: true } | { ok: false; message: string };

const SOMETHING_WENT_WRONG: KycResult = {
  ok: false,
  message: "Something went wrong. Please try again in a moment.",
};

/**
 * Saves the user's investment goals (used to recommend suitable plans).
 * An empty list means they skipped the question.
 */
export async function saveInvestmentGoals(goals: InvestmentGoalId[]): Promise<KycResult> {
  // TODO(api): PUT /api/kyc/investment-goals  { goals }
  void goals;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    demo.advanceSessionStep("kyc-verify-identity");
    return { ok: true };
  }
  return SOMETHING_WENT_WRONG;
}

/** Saves the user's nationality and the ID document they'll verify with. */
export async function saveResidency(
  nationality: CountryCode,
  identityDocument: IdentityDocumentId,
): Promise<KycResult> {
  // TODO(api): PUT /api/kyc/residency  { nationality, identityDocument }
  void nationality;
  void identityDocument;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    return { ok: true };
  }
  return SOMETHING_WENT_WRONG;
}

/** How long the (pretend) scan of one ID side takes in demo mode. */
const DEMO_SCAN_MS = 6000;

/**
 * Uploads one side of the ID and has it checked (readable, not expired,
 * matches the chosen document type).
 */
export async function verifyIdDocumentSide(
  document: IdentityDocumentId,
  side: DocumentSide["id"],
  photo: File,
): Promise<KycResult> {
  // TODO(api): POST /api/kyc/id-document (multipart: document, side, photo)
  //   The server/KYC provider reads the card (OCR) and checks it's genuine.
  //   Failure example: { ok: false, message: "We couldn't read your card. Retake the photo in good light." }
  void document;
  void side;
  void photo;
  if (IS_DEMO_MODE) {
    await wait(DEMO_SCAN_MS);
    return { ok: true };
  }
  return SOMETHING_WENT_WRONG;
}

/** How long the (pretend) face match takes in demo mode. */
const DEMO_FACE_MATCH_MS = 6000;

/**
 * How the selfie was taken:
 *   "camera" = live in the app (preferred)
 *   "upload" = chosen from the device, offered ONLY when the camera doesn't work
 *
 * Product decision: uploads are allowed as a fallback because the backend
 * verifies the face against the ID document. The server should treat
 * uploads with extra care (stricter match threshold, liveness on the
 * image, or manual review), which is why the source is sent along.
 */
export type SelfieSource = "camera" | "upload";

/**
 * Compares the selfie with the photo on the ID document (face match +
 * liveness check, i.e. a real person, not a photo of a photo).
 */
export async function verifySelfieMatch(
  selfie: Blob,
  idPhoto: Blob,
  source: SelfieSource,
): Promise<KycResult> {
  // TODO(api): POST /api/kyc/selfie (multipart: selfie, source). The server
  //   compares it with the stored ID photo through the KYC provider. For Ghana,
  //   providers such as Smile ID can also check the face against the NIA
  //   Ghana Card record. Apply the stricter checks above when source = "upload".
  //   Failure example: { ok: false, message: "We couldn't match your face to your ID. Retake in good light." }
  void selfie;
  void idPhoto;
  void source;
  if (IS_DEMO_MODE) {
    await wait(DEMO_FACE_MATCH_MS);
    // ID and selfie accepted: next time, carry on from the profile.
    demo.advanceSessionStep("kyc-profile");
    return { ok: true };
  }
  return SOMETHING_WENT_WRONG;
}

/** Saves the user's profile details (and optional profile photo). */
export async function saveProfile(
  profile: ProfileValues,
  photo: Blob | null,
): Promise<KycResult> {
  // TODO(api): PUT /api/profile (multipart: profile fields + optional photo).
  //   Phone is stored with the +233 prefix; legal name and date of birth are
  //   checked against the verified ID document on the server.
  void photo;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    demo.updateSessionAccount({
      fullName: profile.fullName,
      gender: profile.gender,
      phone: profile.phone,
    });
    demo.advanceSessionStep("create-pin");
    return { ok: true };
  }
  return SOMETHING_WENT_WRONG;
}
