/**
 * AuthScreenLayout: the shared frame for every auth screen (sign up, login, and
 * later forgot/reset password), so they all look and behave identically.
 *
 *   ←                       ← back link (top-left of the page on larger screens)
 *   Big bold                ← title
 *   Title
 *
 *   {children}              ← the screen's form, social buttons, etc.
 *
 *   Footer text · Link      ← pinned to the bottom on phones
 *
 * Phones: content flows top to bottom, footer pinned to the bottom.
 * Tablets/desktop (sm+): everything is centred in the middle of the page,
 * with spacing that shrinks on short screens (clamp + vh) so it always
 * fits in one screen height.
 */

import Link from "next/link";
import { ArrowLeft } from "@/components/icons";

type AuthScreenLayoutProps = {
  /** Screen title. Use <br /> to control the line break, as in the design. */
  title: React.ReactNode;
  /** Where the back arrow goes. A real link (not history.back), so it works on a direct visit. */
  backHref: string;
  /** Bottom line, e.g. "Already have an account? Log in". */
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function AuthScreenLayout({ title, backHref, footer, children }: AuthScreenLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:justify-center sm:py-8 lg:max-w-sm">
      <Link
        href={backHref}
        aria-label="Back"
        className="-ml-2 grid size-11 place-items-center rounded-full transition-colors hover:bg-foreground/5 sm:fixed sm:top-6 sm:left-6 sm:ml-0"
      >
        <ArrowLeft className="size-6" />
      </Link>

      {/* Capped at 40px on large screens so longer titles ("Log in to your")
          don't dominate the narrow form column. */}
      <h1 className="mt-8 text-[1.75rem] leading-[1.15] font-bold sm:mt-0 sm:text-[clamp(2rem,5vh,2.5rem)]">
        {title}
      </h1>

      {children}

      {/* mt-auto pins this to the bottom on phones; on larger screens it
          simply follows the content. */}
      <p className="mt-auto pt-10 text-center text-[0.9375rem] text-neutral-500 sm:mt-[clamp(1.5rem,4.5vh,2.5rem)] sm:pt-0 lg:text-sm">
        {footer}
      </p>
    </div>
  );
}

/** Green inline link used in the footer ("Log in", "Sign up"). */
export function AuthFooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-brand-700 hover:underline">
      {children}
    </Link>
  );
}

/** Spacing classes shared by the auth forms, so every screen matches. */
export const authFormSpacing =
  "mt-10 flex flex-col gap-5 sm:mt-[clamp(1.5rem,4.5vh,2.5rem)] sm:gap-[clamp(0.875rem,2.2vh,1.25rem)]";
export const authSectionSpacing = "mt-10 sm:mt-[clamp(1.5rem,4.5vh,2.5rem)]";
