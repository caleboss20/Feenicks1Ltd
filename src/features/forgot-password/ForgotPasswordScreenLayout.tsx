/**
 * ForgotPasswordScreenLayout: the shared frame for the three
 * forgot-password steps, matching the design:
 *
 *   ← Forgot Password           ← header row: back arrow + screen title
 *
 *   {children}                  ← illustration, text, fields…
 *
 *   (      Continue      )      ← the screen's button, pinned to the bottom on phones
 *
 * Phones: fills the screen; the screen's content grows (flex-1) so its
 * button can sit at the bottom with `mt-auto`.
 * Tablets/desktop (sm+): everything is centred in the middle of the page.
 */

import Link from "next/link";
import { ArrowLeft } from "@/components/icons";

type ForgotPasswordScreenLayoutProps = {
  /** Shown next to the back arrow, e.g. "Forgot Password". */
  title: string;
  /** Where the back arrow goes (the previous step). */
  backHref: string;
  children: React.ReactNode;
};

export function ForgotPasswordScreenLayout({
  title,
  backHref,
  children,
}: ForgotPasswordScreenLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:justify-center sm:py-8 lg:max-w-sm">
      <header className="flex items-center gap-2">
        <Link
          href={backHref}
          aria-label="Back"
          className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-foreground/5"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-2xl font-bold lg:text-xl">{title}</h1>
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
