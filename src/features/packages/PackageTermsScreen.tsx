"use client";

/**
 * Terms & Conditions for a package: the first step after "Invest in ABC".
 *
 *   ←        Terms & Conditions
 *   Agribusiness Capital (ABC) · Effective 1 October 2026
 *
 *   ┌ KEY POINTS ─────────────────────────┐   ← plain-words summary first
 *   │ • You can invest GH₵ 3,000 – 4,999.99 │
 *   │ • Expected 7–10% a month, not guaranteed…
 *   └─────────────────────────────────────┘
 *   1. About these terms …                     ← the full terms (scrolls)
 *   …
 *   14. Governing law …
 *
 *                                        (↓)   ← floating green arrow: scrolls to
 *   ☐ I have read and agree to the Terms…          the end; turns into ↑ (back to
 *   (          Agree and continue          )       the top) once there
 *
 * Rules (best practice for consent):
 *   - the checkbox only unlocks once the user has scrolled to the end
 *     (the floating arrow shows there's more to read; no nagging text)
 *   - the button only works once the box is ticked
 *   - acceptance is saved with the terms version and time (investmentService)
 *
 * Then → the dashboard (TODO(invest): amount → payment → confirm, once built).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StepScreenLayout, stickyActionsClass } from "@/components/layout/StepScreenLayout";
import { ArrowLeft } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { packageDetailsHref, type InvestmentPackage } from "./investmentPackages";
import { acceptPackageTerms } from "./investmentService";
import { keyPointsFor, termsFor, TERMS_EFFECTIVE_DATE } from "./termsAndConditions";

/** Where "Agree and continue" leads. TODO(invest): the amount/payment step once built. */
const NEXT_SCREEN = ROUTES.dashboard;

/** Height of the pinned bottom bar: the end only counts as "read" when visible above it. */
const BOTTOM_BAR_HEIGHT_PX = 150;

export function PackageTermsScreen({ pkg }: { pkg: InvestmentPackage }) {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const [hasReadToEnd, setHasReadToEnd] = useState(false);
  /** The end of the terms is on screen right now (the arrow then points up). */
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Is the end of the terms on screen (above the pinned bottom bar)? Seeing it
  // once unlocks the checkbox for good. Checked on every scroll and resize,
  // plus once on arrival in case the terms fit (e.g. on desktop).
  useEffect(() => {
    const check = () => {
      const end = endRef.current;
      if (!end) return;
      const atEnd = end.getBoundingClientRect().top <= window.innerHeight - BOTTOM_BAR_HEIGHT_PX;
      setIsAtEnd(atEnd);
      if (atEnd) setHasReadToEnd(true);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  /** The floating arrow: down to the end, or back up to the top once there. */
  const scrollFurther = () => {
    window.scrollTo({
      top: isAtEnd ? 0 : document.documentElement.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const handleAgree = async () => {
    if (!hasAgreed) return;
    setError(null);
    setIsSaving(true);
    const result = await acceptPackageTerms(pkg.id);
    if (!result.ok) {
      setIsSaving(false);
      setError(result.message);
      return;
    }
    router.replace(NEXT_SCREEN);
  };

  return (
    <StepScreenLayout
      title="Terms & Conditions"
      centeredTitle
      stickyHeader
      backHref={packageDetailsHref(pkg.id)}
    >
      <div className="flex flex-1 flex-col sm:flex-none">
        <p className="text-sm text-neutral-500">
          <span className="font-semibold text-foreground">
            {pkg.name} ({pkg.ticker})
          </span>{" "}
          · Effective {TERMS_EFFECTIVE_DATE}
        </p>

        {/* Plain-words summary, before the full legal text. */}
        <section
          aria-labelledby="key-points-title"
          className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-500/20 dark:bg-brand-500/10"
        >
          <h2
            id="key-points-title"
            className="text-xs font-semibold tracking-wider text-brand-800 uppercase dark:text-brand-300"
          >
            Key points
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {keyPointsFor(pkg).map((point) => (
              <li key={point} className="flex gap-2.5 text-sm leading-relaxed">
                <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-brand-600" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* The full terms. */}
        <div className="mt-7 flex flex-col gap-6">
          {termsFor(pkg).map((section) => (
            <section key={section.title}>
              <h3 className="text-[0.9375rem] font-bold lg:text-sm">{section.title}</h3>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* Reaching this marker unlocks the checkbox. */}
        <div ref={endRef} aria-hidden className="h-px" />

        <div className={cn(stickyActionsClass, "relative")}>
          {/* Floating round arrow, just above the bar, like banking apps. */}
          <button
            type="button"
            onClick={scrollFurther}
            aria-label={isAtEnd ? "Back to the top" : "Scroll to the end of the terms"}
            className="absolute -top-16 right-6 grid size-12 cursor-pointer place-items-center rounded-full bg-brand-600 text-white transition-[background-color,transform] hover:bg-brand-700 active:scale-95 sm:-top-16 sm:right-0"
          >
            {/* ArrowLeft turned to point down (more to read) or up (back to top). */}
            <ArrowLeft
              className={cn(
                "size-5 transition-transform duration-300",
                isAtEnd ? "rotate-90" : "-rotate-90",
              )}
            />
          </button>

          {error && (
            <div className="mb-3">
              <FormErrorMessage message={error} />
            </div>
          )}

          <Checkbox
            label="I have read and agree to the Terms & Conditions and understand the risks."
            checked={hasAgreed}
            disabled={!hasReadToEnd || isSaving}
            onChange={(event) => setHasAgreed(event.target.checked)}
            size="sm"
            className="items-start gap-2.5 text-[0.8125rem] leading-snug font-normal text-neutral-700 has-disabled:cursor-not-allowed has-disabled:opacity-50 lg:text-[0.8125rem] dark:text-neutral-300"
          />
          <Button
            size="lg"
            fullWidth
            disabled={!hasAgreed}
            isLoading={isSaving}
            loadingLabel="Saving"
            onClick={handleAgree}
            className="mt-4"
          >
            Agree and continue
          </Button>
        </div>
      </div>
    </StepScreenLayout>
  );
}
