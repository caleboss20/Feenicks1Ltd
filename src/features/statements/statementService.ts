import { IS_DEMO_MODE } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import type { StatementPeriod } from "./statementModel";

/**
 * Statements service: issues statement numbers and keeps the list of
 * statements an investor has issued (Statements › Recent statements).
 *
 * Every statement gets a number, e.g. "F1S-20261008-482913", printed on it
 * and in its QR code, so a copy can be traced back to when it was issued.
 * TODO(api): POST /api/statements { from, to } → { number, issuedAt } — the
 * server issues and signs the number, keeps a copy of the figures, and a
 * public page (/verify/:number) confirms a statement is genuine; the QR code
 * then carries that link.
 */

export type IssuedStatement = {
  number: string;
  /** The period covered (ISO dates). */
  from: string;
  to: string;
  issuedAt: string;
};

/** How many issued statements the list keeps (newest first). */
const MAX_KEPT = 20;

function randomDigits(count: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(count)), (byte) => byte % 10).join("");
}

/** Issues a statement number for `period` and adds it to the account's list. */
export function issueStatement(period: StatementPeriod): IssuedStatement {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const issued: IssuedStatement = {
    number: `F1S-${stamp}-${randomDigits(6)}`,
    from: period.from.toISOString(),
    to: period.to.toISOString(),
    issuedAt: now.toISOString(),
  };
  if (IS_DEMO_MODE) {
    const email = demo.getSessionEmail();
    const account = email ? demo.findAccount(email) : null;
    if (email && account) {
      demo.updateAccount(email, { statements: [issued, ...(account.statements ?? [])].slice(0, MAX_KEPT) });
    }
  }
  return issued;
}

/** The statements this account has issued, newest first. */
export function getIssuedStatements(): IssuedStatement[] {
  if (!IS_DEMO_MODE) return [];
  const email = demo.getSessionEmail();
  return (email && demo.findAccount(email)?.statements) || [];
}
