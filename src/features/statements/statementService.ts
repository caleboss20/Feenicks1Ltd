import { IS_DEMO_MODE } from "@/config/demoMode";
import { ROUTES } from "@/config/routes";
import * as demo from "@/demo/demoAccounts";
import { notify } from "@/demo/demoNotifications";
import type { Transaction } from "@/features/transactions/transactionModel";
import type { StatementPeriod } from "./statementModel";

/**
 * Statements service: issues reference numbers for statements and proof of
 * funds letters, keeps the list of documents an investor has issued
 * (Statements › Recent), and makes each month's statement ready when the
 * month ends (with a notification).
 *
 * Every document gets a number printed on it and in its QR code, so a copy
 * can be traced back to when it was issued:
 *   F1S-20261008-482913   a statement (any period, or a month's)
 *   F1P-20261008-551204   a proof of funds letter
 * TODO(api): POST /api/statements and /api/letters → { number, issuedAt } —
 * the server issues and signs the number, keeps a copy of the figures, and
 * a public page (/verify/:number) confirms a document is genuine; the QR code
 * then carries that link. Monthly statements are made by a server job on the
 * 1st of each month, which sends the notification (and an email).
 */

export type IssuedDocumentKind = "statement" | "monthly" | "letter";

export type IssuedStatement = {
  number: string;
  /** Statement, a month's statement, or a proof of funds letter (missing on older records: a statement). */
  kind?: IssuedDocumentKind;
  /** The period covered (ISO dates). For a letter, both are the "balance as of" date. */
  from: string;
  to: string;
  issuedAt: string;
  /** Letters: who it's addressed to and why (to make it again exactly). */
  addressedTo?: string;
  purpose?: string;
};

/** How many issued documents the list keeps (newest first). */
const MAX_KEPT = 20;

function randomDigits(count: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(count)), (byte) => byte % 10).join("");
}

function stamp(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function keep(issued: IssuedStatement) {
  if (!IS_DEMO_MODE) return;
  const email = demo.getSessionEmail();
  const account = email ? demo.findAccount(email) : null;
  if (email && account) {
    demo.updateAccount(email, { statements: [issued, ...(account.statements ?? [])].slice(0, MAX_KEPT) });
  }
}

/** Issues a statement number for `period` and adds it to the account's list. */
export function issueStatement(period: StatementPeriod, kind: "statement" | "monthly" = "statement"): IssuedStatement {
  const now = new Date();
  const issued: IssuedStatement = {
    number: `F1S-${stamp(now)}-${randomDigits(6)}`,
    kind,
    from: period.from.toISOString(),
    to: period.to.toISOString(),
    issuedAt: now.toISOString(),
  };
  keep(issued);
  return issued;
}

/** Issues a proof of funds letter number (balance as of `asOf`) and adds it to the list. */
export function issueLetter(asOf: Date, addressedTo: string, purpose: string): IssuedStatement {
  const now = new Date();
  const issued: IssuedStatement = {
    number: `F1P-${stamp(now)}-${randomDigits(6)}`,
    kind: "letter",
    from: asOf.toISOString(),
    to: asOf.toISOString(),
    issuedAt: now.toISOString(),
    addressedTo,
    purpose,
  };
  keep(issued);
  return issued;
}

/** The documents this account has issued, newest first. */
export function getIssuedStatements(): IssuedStatement[] {
  if (!IS_DEMO_MODE) return [];
  const email = demo.getSessionEmail();
  return (email && demo.findAccount(email)?.statements) || [];
}

/* ── Monthly statements ──────────────────────────────────────────── */

export type StatementMonthOption = { key: string; label: string; period: StatementPeriod };

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

/**
 * Every month that has ended since the first completed transaction, newest
 * first (up to 12): each has a ready statement.
 */
export function completedMonths(transactions: Transaction[], now = new Date()): StatementMonthOption[] {
  const completed = transactions.filter((item) => item.status === "completed");
  if (completed.length === 0) return [];
  const first = new Date(Math.min(...completed.map((item) => Date.parse(item.createdAt))));
  const months: StatementMonthOption[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const earliest = new Date(first.getFullYear(), first.getMonth(), 1);
  while (cursor >= earliest && months.length < 12) {
    const from = new Date(cursor);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push({
      key: monthKey(cursor),
      label: cursor.toLocaleDateString("en-GH", { month: "long", year: "numeric" }),
      period: { from, to },
    });
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return months;
}

/**
 * When a month has ended, its statement is ready: tell the investor once
 * (only for the latest month, so a returning investor gets one message,
 * not a backlog). Called when Home opens. Demo only (TODO(api): a server job).
 */
export function announceMonthlyStatement(transactions: Transaction[]): void {
  if (!IS_DEMO_MODE) return;
  const latest = completedMonths(transactions)[0];
  const email = demo.getSessionEmail();
  const account = email ? demo.findAccount(email) : null;
  if (!latest || !email || !account) return;
  if (account.monthlyStatementAnnounced && account.monthlyStatementAnnounced >= latest.key) return;
  demo.updateAccount(email, { monthlyStatementAnnounced: latest.key });
  notify(email, {
    kind: "investing",
    title: `Your ${latest.label} statement is ready`,
    body: "See what came in, what you earned and what went out last month. Download it as a PDF or Excel file.",
    href: `${ROUTES.statements}?month=${latest.key}`,
  });
}
