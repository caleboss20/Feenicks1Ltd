import type { PackageId } from "@/features/packages/investmentPackages";
import type { MomoNetwork } from "@/lib/mobileMoney";

/**
 * A Mobile Money payment into the user's package: what's on the confirm
 * sheet, sent to their phone to approve.
 *
 *   pending ──approved on the phone──▶ approved   (the investment is recorded)
 *      │
 *      ├──declined on the phone──────▶ declined
 *      ├──not approved in time───────▶ expired
 *      └──cancelled in the app───────▶ cancelled
 *
 * Only "approved" moves money. The user approves with their MoMo PIN in the
 * network's own prompt on their phone, never in this app.
 */
export type PaymentStatus = "pending" | "approved" | "declined" | "expired" | "cancelled";

export type MomoPayment = {
  /** e.g. "PAY48291736". */
  id: string;
  packageId: PackageId;
  /** What goes into the package, in GH₵. */
  amount: number;
  /** Charged on top, in GH₵ (PAYMENT_FEE). */
  fee: number;
  network: MomoNetwork;
  /** The wallet: their profile number, 9 digits (no +233 or 0). */
  phone: string;
  status: PaymentStatus;
  createdAt: string;
  /** When the prompt was last sent (Resend sends a new one). */
  sentAt: string;
  /** When the prompt stops working: APPROVAL_WINDOW_MS after it was sent. */
  expiresAt: string;
  /** Once approved: the investment it recorded (its receipt). */
  transactionId?: string;
};

/** Payments that are over, one way or another, and didn't move money. */
export type UnfinishedPaymentStatus = Exclude<PaymentStatus, "pending" | "approved">;

/** How long they have to approve on their phone (networks allow about this). */
export const APPROVAL_WINDOW_MS = 2 * 60 * 1000;

/** No new prompt until this long after the last, so phones aren't flooded. */
export const RESEND_AFTER_MS = 30 * 1000;

/** How often the waiting screen asks whether it's been approved. */
export const PAYMENT_POLL_MS = 2000;

/**
 * Fee on a payment into a package, in GH₵.
 * TODO(ceo): confirm. Feenicks1 charges nothing for now, and the MoMo
 * network's own charge (if any) is between the user and their network.
 * The confirm sheet shows "No fee" while this is 0.
 */
export const PAYMENT_FEE = 0;
