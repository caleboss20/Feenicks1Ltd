import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import type { CountryCode, DocumentSide, IdentityDocumentId } from "./identityDocuments";
import type { InvestmentGoalId } from "./investmentGoals";

/**
 * KYC service: the single place the identity-verification screens talk to
 * the server. Screens never `fetch` directly.
 *
 * In DEMO MODE (see config/demoMode.ts) every call succeeds.
 */

export type KycResult = { ok: true } | { ok: false; message: string };

const SOMETHING_WENT_WRONG: KycResult = {
  ok: false,
  message: "Something went wrong. Please try again in a moment.",
};

/** Saves the user's investment goals (used to recommend suitable plans). */
export async function saveInvestmentGoals(goals: InvestmentGoalId[]): Promise<KycResult> {
  // TODO(api): PUT /api/kyc/investment-goals  { goals }
  void goals;
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
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
