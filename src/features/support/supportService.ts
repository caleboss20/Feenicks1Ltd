import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import { ROUTES } from "@/config/routes";
import * as demo from "@/demo/demoAccounts";
import { notify } from "@/demo/demoNotifications";

/**
 * Support service: messages to the Feenicks1 team. In DEMO MODE they're kept
 * on the demo account (src/demo), as the server will keep them.
 */

export type SupportTopic = "investing" | "withdrawals" | "account" | "referrals" | "other";

export const SUPPORT_TOPICS: { id: SupportTopic; label: string }[] = [
  { id: "investing", label: "Investing" },
  { id: "withdrawals", label: "Withdrawals" },
  { id: "account", label: "My account" },
  { id: "referrals", label: "Referrals" },
  { id: "other", label: "Something else" },
];

export type SupportRequest = {
  /** Reference the user can quote, e.g. "SUP482913". */
  id: string;
  topic: SupportTopic;
  message: string;
  /** The transaction it's about, if they picked one. */
  transactionId?: string;
  createdAt: string;
  /** received → (the team replies) answered → closed. Only "received" exists until the backend does. */
  status: "received" | "answered" | "closed";
};

export const MESSAGE_MIN_LENGTH = 10;
export const MESSAGE_MAX_LENGTH = 1000;

export type SendResult = { ok: true; request: SupportRequest } | { ok: false; message: string };

/**
 * Sends a message to the support team.
 *
 * Server requirements (for the backend): store it with the user, notify the
 * team, and reply by the user's registered email/SMS; return the reference.
 */
export async function sendSupportMessage(input: {
  topic: SupportTopic;
  message: string;
  transactionId?: string;
}): Promise<SendResult> {
  const message = input.message.trim();
  if (message.length < MESSAGE_MIN_LENGTH) {
    return { ok: false, message: `Tell us a little more (at least ${MESSAGE_MIN_LENGTH} characters).` };
  }

  // TODO(api): POST /api/support/requests  { topic, message, transactionId }
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    const email = demo.getSessionEmail();
    if (!email) return { ok: false, message: "Please log in again, then send your message." };
    const digits = Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) => byte % 10).join("");
    const request: SupportRequest = {
      id: `SUP${digits}`,
      topic: input.topic,
      message: message.slice(0, MESSAGE_MAX_LENGTH),
      ...(input.transactionId ? { transactionId: input.transactionId } : {}),
      createdAt: new Date().toISOString(),
      status: "received",
    };
    const previous = demo.findAccount(email)?.supportRequests ?? [];
    demo.updateAccount(email, { supportRequests: [...previous, request] });
    notify(email, {
      kind: "support",
      title: "We received your message",
      body: `Reference ${request.id}. Our team will get back to you.`,
      href: ROUTES.support,
    });
    return { ok: true, request };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}
