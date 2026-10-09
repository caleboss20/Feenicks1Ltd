/**
 * The legal centre (/legal) and each document (/legal/<slug>): public pages
 * (readable before sign-up), server-rendered, in the app's own type and
 * layout. Every document carries a "Draft for legal review" label until a
 * lawyer approves it (TODO(legal): remove IS_DRAFT then).
 *
 *   ←  Terms of Use
 *   [Draft for legal review] · Updated 9 October 2026
 *   ON THIS PAGE  1. About these terms · 2. Who can use …   ← jump links
 *   1. About these terms
 *   …paragraphs, lists, tables…
 *   ─────────────────────────
 *   Feenicks1 Solutions Ltd · contacts
 */

import Link from "next/link";
import { COMPANY } from "@/config/company";
import { ROUTES } from "@/config/routes";
import { LEGAL_DOCUMENTS, type LegalBlock, type LegalDocument } from "./legalDocuments";
import { SECTION_LABEL } from "@/components/ui/styles";

const IS_DRAFT = true;
const LABEL = SECTION_LABEL;

function Page({ title, backHref, children }: { title: string; backHref: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-12 lg:max-w-2xl">
      <header className="sticky top-0 z-20 -mx-6 grid grid-cols-[2.75rem_1fr_2.75rem] items-center bg-background px-6 py-2">
        <Link href={backHref} aria-label="Back" className="-ml-2 grid size-11 place-items-center rounded-full transition-colors hover:bg-foreground/5">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m6-6-6 6 6 6" />
          </svg>
        </Link>
        <h1 className="truncate text-center text-base font-semibold">{title}</h1>
      </header>
      {children}
      <footer className="mt-auto border-t border-neutral-200 pt-6 text-xs leading-5 text-neutral-500 dark:border-white/10 dark:text-neutral-400">
        <p className="font-semibold text-neutral-700 dark:text-neutral-300">{COMPANY.legalName}</p>
        <p>
          Reg. No. {COMPANY.registrationNumber} · {COMPANY.address}
        </p>
        <p>
          {COMPANY.phones.join(" · ")} · {COMPANY.email}
        </p>
      </footer>
    </main>
  );
}

function DraftNote({ updated }: { updated: string }) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
      {IS_DRAFT && (
        <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
          Draft for legal review
        </span>
      )}
      Updated {updated}
    </p>
  );
}

/** /legal: the list of documents. */
export function LegalIndexScreen({ backHref = ROUTES.account }: { backHref?: string }) {
  return (
    <Page title="Legal" backHref={backHref}>
      <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
        The agreements and policies that apply when you use Feenicks1. Please read them before you invest.
      </p>
      <ul className="mt-6 mb-10 divide-y divide-neutral-100 rounded-3xl border border-neutral-200 dark:divide-white/10 dark:border-white/10">
        {LEGAL_DOCUMENTS.map((item) => (
          <li key={item.slug}>
            <Link href={`${ROUTES.legal}/${item.slug}`} className="group flex items-center gap-3 px-5 py-4">
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold">{item.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">{item.summary}</span>
              </span>
              <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 text-neutral-500 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

/** /legal/<slug>: one document, with jump links to its sections. */
export function LegalDocumentScreen({ document }: { document: LegalDocument }) {
  return (
    <Page title={document.title} backHref={ROUTES.legal}>
      <DraftNote updated={document.updated} />
      <p className="mt-4 text-[0.9375rem] leading-7 text-neutral-700 dark:text-neutral-300">{document.summary}</p>

      <nav aria-label="On this page" className="mt-6 rounded-3xl bg-neutral-50 p-5 dark:bg-white/5">
        <p className={LABEL}>On this page</p>
        <ol className="mt-3 flex flex-col gap-2 text-sm">
          {document.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mb-12">
        {document.sections.map((section) => (
          <section key={section.id} id={section.id} className="mt-9 scroll-mt-16">
            <h2 className="text-lg leading-snug font-bold tracking-tight">{section.title}</h2>
            <div className="mt-3 flex flex-col gap-3 text-[0.9375rem] leading-7 text-neutral-700 dark:text-neutral-300">
              {section.blocks.map((block, index) => (
                <Block key={index} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === "p") return <p>{block.text}</p>;
  if (block.kind === "list") {
    return (
      <ul className="flex flex-col gap-2">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-brand-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  // Wide tables (4+ columns) read better on a phone as one card per row.
  if (block.head.length > 3) {
    return (
      <ul className="flex flex-col gap-3">
        {block.rows.map((row) => (
          <li key={row[0]} className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <p className="text-[0.9375rem] font-semibold text-foreground">{row[0]}</p>
            <dl className="mt-2 flex flex-col gap-1.5 text-[0.8125rem] leading-5">
              {row.slice(1).map((cell, index) => (
                <div key={block.head[index + 1]} className="flex justify-between gap-4">
                  <dt className="text-neutral-500 dark:text-neutral-400">{block.head[index + 1]}</dt>
                  <dd className="text-right font-medium text-foreground tabular-nums">{cell}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    );
  }
  return (
    // Focusable, so keyboard users can scroll a table wider than the screen.
    <div className="-mx-1 overflow-x-auto" tabIndex={0} role="region" aria-label="Table">
      <table className="w-full min-w-[20rem] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-neutral-200 text-left text-[0.8125rem] leading-5 dark:border-white/10">
        <thead>
          <tr className="bg-brand-50 dark:bg-brand-500/10">
            {block.head.map((cell) => (
              <th key={cell} scope="col" className="px-3 py-2.5 font-semibold text-brand-900 dark:text-brand-200">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-t border-neutral-200 px-3 py-2.5 align-top dark:border-white/10">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
