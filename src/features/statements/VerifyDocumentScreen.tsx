import Image from "next/image";
import { COMPANY } from "@/config/company";
import { IS_DEMO_MODE } from "@/config/demoMode";
import { readVerifyFacts } from "./verifyLink";

/**
 * The verify page a statement's or letter's QR code opens (a server
 * component: no login, nothing to load in the browser).
 *
 *            Feenicks1
 *   ╭──────────────────────────────────────╮
 *   │ ✓ Feenicks1 document                 │   ← with the backend: "Genuine",
 *   │ Proof of funds · F1P-20261008-551204  │     checked against the server's copy
 *   │ Account holder   Kofi Mensah          │
 *   │ Balance as of    8 Oct 2026           │
 *   │ Balance          GHS 2,012.10         │
 *   │ Issued           8 Oct 2026, 6:49 pm   │
 *   ╰──────────────────────────────────────╯
 *   The live check with Feenicks1's records isn't connected yet…   ← until then
 *   Questions? +233 … · email
 *
 * TODO(api): GET /api/verify/:number — show "Genuine document" with the
 * server's own copy of the facts, or "We couldn't find this document";
 * never trust the facts carried in the link once the server can answer.
 */
export function VerifyDocumentScreen({ number, encoded }: { number: string; encoded: string | null }) {
  const facts = readVerifyFacts(encoded);
  const matches = facts !== null && facts.number === number;
  const isLetter = facts?.kind === "letter";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10">
      <Image
        src="/brand/logo-wordmark-green.png"
        alt="Feenicks1"
        width={680}
        height={121}
        priority
        className="mx-auto h-auto w-36"
      />
      <h1 className="mt-8 text-center text-xl font-bold tracking-tight">Verify a document</h1>
      <p className="mt-1.5 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Statements and proof of funds letters issued by {COMPANY.legalName}
      </p>

      {matches && facts ? (
        <section className="mt-7 rounded-3xl border border-neutral-200 p-5 dark:border-white/10">
          <p className="flex items-center gap-2 text-[0.9375rem] font-bold text-brand-700 dark:text-brand-400">
            <span aria-hidden className="grid size-6 place-items-center rounded-full bg-brand-700 text-white">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5 9-10" />
              </svg>
            </span>
            Feenicks1 {isLetter ? "proof of funds letter" : "account statement"}
          </p>
          <p className="mt-1 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">{facts.number}</p>
          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <Row label="Account holder" value={facts.holder} />
            {facts.wallet && <Row label="Wallet ID" value={facts.wallet} />}
            <Row label={isLetter ? "Balance as of" : "Period"} value={facts.period} />
            <Row label={isLetter ? "Balance" : "Closing balance"} value={facts.balance} strong />
            <Row label="Issued" value={facts.issued} />
          </dl>
        </section>
      ) : (
        <section className="mt-7 rounded-3xl border border-neutral-200 p-5 text-center dark:border-white/10">
          <p className="text-[0.9375rem] font-bold">We couldn&apos;t read this document&apos;s details</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            Reference {number}. Scan the QR code on the document again, or contact us with this reference.
          </p>
        </section>
      )}

      {IS_DEMO_MODE && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          The live check against Feenicks1&apos;s records isn&apos;t connected yet. These are the details carried in
          the document&apos;s QR code; compare them with the printed document.
        </p>
      )}

      <p className="mt-auto pt-10 text-center text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        Questions about a document? Contact {COMPANY.legalName}
        <br />
        {COMPANY.phones.join(" · ")} · {COMPANY.email}
        <br />
        {COMPANY.address}
      </p>
    </main>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className={strong ? "text-right text-[0.9375rem] font-bold tabular-nums" : "text-right font-medium"}>{value}</dd>
    </div>
  );
}
