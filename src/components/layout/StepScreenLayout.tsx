/**
 * StepScreenLayout: the shared frame for step-by-step screens with a
 * back arrow and a small title in the header (email verification, the
 * forgot-password steps, and later profile setup and identity checks):
 *
 *   ← Verify Email              ← header row: back arrow + screen title
 *
 *   {children}                  ← text, fields, code boxes…
 *
 *   (      Continue      )      ← the screen's button, pinned to the bottom on phones
 *
 * Centred-title variant (`centeredTitle`), as in the 2FA mockup:
 *
 *   ←      Two-factor authentication      ◌    ← back · title · optional action
 *
 * Phones: fills the screen; the screen's content grows (flex-1) so its
 * button can sit at the bottom with `mt-auto`.
 * Tablets/desktop (sm+): everything is centred in the middle of the page.
 */

import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { cn } from "@/lib/utils";

type StepScreenLayoutProps = {
  /** Shown in the header, e.g. "Forgot Password". */
  title: string;
  /**
   * Where the back arrow goes (the previous step). Leave it out on screens
   * the user shouldn't go back from (e.g. right after sign-up is complete).
   */
  backHref?: string;
  /** Show the back arrow on desktop only (hidden on phones and tablets). */
  backOnDesktopOnly?: boolean;
  /** Optional line under the title, e.g. an explanation of the step. */
  subtitle?: string;
  /** Wider column on desktop, for screens with side-by-side content (e.g. 2-column options). */
  wide?: boolean;
  /** Smaller title centred between the back arrow and `headerAction` (2FA screens). */
  centeredTitle?: boolean;
  /** Small element on the right of a centred header, e.g. a countdown ring. */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
};

export function StepScreenLayout({
  title,
  backHref,
  backOnDesktopOnly,
  subtitle,
  wide,
  centeredTitle,
  headerAction,
  children,
}: StepScreenLayoutProps) {
  const backLink = backHref && (
    <Link
      href={backHref}
      aria-label="Back"
      className={cn(
        "-ml-2 size-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-foreground/5",
        backOnDesktopOnly ? "hidden lg:grid" : "grid",
      )}
    >
      <ArrowLeft className="size-6" />
    </Link>
  );

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:justify-center sm:py-8",
        wide ? "lg:max-w-2xl" : "lg:max-w-sm",
      )}
    >
      <header>
        {centeredTitle ? (
          // Equal side columns keep the title exactly centred on the screen.
          <div className="grid min-h-11 grid-cols-[2.75rem_1fr_2.75rem] items-center">
            {backLink || <span />}
            <h1 className="text-center text-[1.0625rem] leading-tight font-bold">{title}</h1>
            <div className="flex justify-end">{headerAction}</div>
          </div>
        ) : (
          <div className="flex min-h-11 items-center gap-2">
            {backLink}
            <h1 className="text-[1.375rem] font-bold lg:text-xl">{title}</h1>
          </div>
        )}
        {subtitle && (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-neutral-600 lg:text-sm dark:text-neutral-400">
            {subtitle}
          </p>
        )}
      </header>

      <div className="mt-6 flex flex-1 flex-col sm:flex-none lg:mt-4">{children}</div>
    </div>
  );
}

/**
 * Classes for a step's <form>, so its button can be pinned to the bottom on
 * phones. Put the button last, inside <div className={stepActionsClass}>.
 */
export const stepFormClass = "flex flex-1 flex-col gap-5 sm:flex-none";

/** Wrapper for a step's main button: pinned to the bottom on phones, spaced normally on desktop. */
export const stepActionsClass = "mt-auto pt-6 sm:mt-8 sm:pt-0 lg:mt-6";
