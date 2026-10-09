import { siteConfig } from "@/config/site";

/**
 * The link in a statement's or letter's QR code: the public verify page,
 * /verify/<number>. Until the server keeps a copy of every document, the
 * link also carries the document's key facts (`d`, base64url JSON), so the
 * verify page can show what the document says on any phone.
 * TODO(api): drop `d`; the verify page asks GET /api/verify/:number, and the
 * server answers "genuine" (with its own copy of the facts) or "not found".
 */

export type VerifyFacts = {
  /** "statement" or "letter". */
  kind: "statement" | "letter";
  number: string;
  holder: string;
  wallet: string | null;
  /** "1 Jul 2026 – 8 Oct 2026" (statement) or "8 Oct 2026" (letter: balance as of). */
  period: string;
  /** "GHS 2,012.10": closing balance (statement) or balance (letter). */
  balance: string;
  issued: string;
};

const toBase64Url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (value: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0)),
  );

export function verifyUrl(facts: VerifyFacts): string {
  return `${siteConfig.url}/verify/${encodeURIComponent(facts.number)}?d=${toBase64Url(JSON.stringify(facts))}`;
}

/** The facts carried in a verify link, or null if missing or unreadable. */
export function readVerifyFacts(value: string | null): VerifyFacts | null {
  if (!value) return null;
  try {
    const facts = JSON.parse(fromBase64Url(value)) as VerifyFacts;
    return typeof facts.number === "string" && typeof facts.holder === "string" ? facts : null;
  } catch {
    return null;
  }
}
