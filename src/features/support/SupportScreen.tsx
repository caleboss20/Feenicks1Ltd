"use client";

/**
 * Help & support (the headset on Home, and Account › Help & support), after
 * the user's reference (Kussbus): plain words, white page (black in dark mode).
 *
 *   ←  Help & support
 *   We're here to help you with anything
 *   and everything on Feenicks1
 *   Whether it's investing, withdrawals or your account…   (grey)
 *   ( 🔍 Search help                          )
 *   FAQ
 *   ─────────────────────────────────────────
 *   What is Feenicks1?                        +   ← tap: the answer opens
 *   ─────────────────────────────────────────      underneath, + becomes ×
 *   How do I make my first investment?        +      (one open at a time)
 *   …
 *          Still stuck? Help is a message away      ← pinned at the bottom
 *   (              Send a message              )
 *
 * Answers quote the app's real settings (faqs.ts). Searching filters them as
 * you type.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlusIcon, SearchIcon } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { chosenDashboardColor } from "@/features/dashboard/dashboardTheme";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/useThemeStore";
import { searchFaqs, wordMatch, wordsOf, type Faq } from "./faqs";

/** White page in light mode, black in dark (the phone's status bar matches). */
const PAGE_COLORS = { light: "#ffffff", dark: "#0a0a0a" };

export function SupportScreen() {
  useStatusBarColor(PAGE_COLORS);
  const router = useRouter();
  // The button takes their dashboard colour (green by default), like the rest of the app.
  const color = chosenDashboardColor(
    useThemeStore((state) => state.dashboardColor),
    useThemeStore((state) => state.customDashboardColor),
  );
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const search = query.trim();
  // Best matches first; typos forgiven ("feeen" finds Feenicks1).
  const shown = searchFaqs(search);

  /** Back where they came from (Home or Account); Home if they landed here directly. */
  const goBack = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.dashboard));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="-ml-2 flex items-center gap-1">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="grid size-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-medium">Help &amp; support</h1>
      </header>

      <p className="mt-5 text-[1.375rem] leading-snug font-semibold tracking-tight">
        We&apos;re here to help you with anything and everything on Feenicks1
      </p>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
        Whether it&apos;s investing, withdrawals or your account, we&apos;ve got you covered. Share
        your concern or check our frequently asked questions below.
      </p>

      <label className="mt-6 flex h-12 items-center gap-3 rounded-full border border-neutral-200 bg-neutral-100 px-4 dark:border-white/10 dark:bg-white/5">
        <SearchIcon className="size-5 text-neutral-500" />
        <span className="sr-only">Search help</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search help"
          enterKeyHint="search"
          // 16px text: smaller makes iPhones zoom in on tap.
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-neutral-500"
        />
      </label>

      <h2 className="mt-7 text-sm font-bold">FAQ</h2>

      {shown.length > 0 ? (
        // Rows run edge to edge, with hairlines between them, like the reference.
        <ul className="-mx-5 mt-3 border-t border-neutral-100 dark:border-white/10">
          {shown.map((faq) => (
            <FaqRow
              key={faq.id}
              faq={faq}
              search={search}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-neutral-500 dark:text-neutral-400">
          No answers for “{search}”. Send us a message below and we&apos;ll help.
        </p>
      )}

      {/* Pinned at the bottom, so help is always one tap away. */}
      <div className="sticky bottom-0 mt-auto bg-background pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-[0.9375rem] font-medium">Still stuck? Help is a message away</p>
        <Link
          href={ROUTES.supportMessage}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-full text-[0.9375rem] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: color.top }}
        >
          Send a message
        </Link>
      </div>
    </div>
  );
}

/**
 * The question, with the words that matched the search in bold (typos
 * included, so "feeen" shows why "What is Feenicks1?" came up).
 */
function MatchedWords({ text, search }: { text: string; search: string }) {
  const typed = wordsOf(search);
  if (typed.length === 0) return <>{text}</>;
  // Odd parts are words, even parts what's between them (spaces, "?", "'"…).
  const parts = text.split(/([A-Za-z0-9]+)/);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 && typed.some((word) => wordMatch(word, part.toLowerCase()) > 0) ? (
          <strong key={index} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** One question: tap to open its answer underneath (+ turns into ×). */
function FaqRow({
  faq,
  search,
  isOpen,
  onToggle,
}: {
  faq: Faq;
  search: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const answerId = `faq-${faq.id}-answer`;
  return (
    <li className="border-b border-neutral-100 px-5 dark:border-white/10">
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={answerId}
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
        >
          <span
            className={cn(
              "text-[0.9375rem] leading-snug",
              isOpen ? "font-medium text-foreground" : "text-neutral-600 dark:text-neutral-300",
            )}
          >
            <MatchedWords text={faq.question} search={search} />
          </span>
          <PlusIcon
            className={cn(
              "size-4 shrink-0 text-neutral-400 transition-transform duration-200",
              isOpen && "rotate-45",
            )}
          />
        </button>
      </h3>
      {isOpen && (
        <div id={answerId} className="pb-5 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {faq.answer.map((part, index) =>
            typeof part === "string" ? (
              <p key={index} className={index > 0 ? "mt-2" : undefined}>
                {part}
              </p>
            ) : (
              <ul key={index} className="mt-2 flex flex-col gap-1">
                {part.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ),
          )}
        </div>
      )}
    </li>
  );
}
