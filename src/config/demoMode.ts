/**
 * DEMO MODE: lets the app be used end to end before the backend exists.
 *
 * When ON (the current default):
 *   - accounts are kept in THIS browser (src/demo/demoAccounts.ts): sign
 *     up, log out, log back in and continue where you left off
 *   - wrong email/password and wrong PIN are refused, like the real thing
 *   - ANY verification code of the right length is accepted
 *   - nothing is sent anywhere (no emails, no SMS, no server)
 *
 * When OFF: the real server calls (the TODO(api) spots in each
 * `…Service.ts` file) are used.
 *
 * ⚠️ Must be turned OFF before launch. Set this in `.env.local` or on the hosting provider:
 *      NEXT_PUBLIC_DEMO_MODE=false
 */
export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

/** Pretend network delay in demo mode, so loading states ("Verifying…") are visible. */
export const DEMO_DELAY_MS = 700;

/** Waits `ms` milliseconds (used to simulate the network in demo mode). */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
