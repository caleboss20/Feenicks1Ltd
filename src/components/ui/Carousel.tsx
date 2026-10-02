"use client";

/**
 * Carousel: swipeable slides with dots and autoplay. Used for the banner
 * cards on the dashboard and the invite cards on the Account screen.
 *
 *   ╭──────────────────────────────╮ ╭──
 *   │  slide 1                ▬ • • │ │ slide 2…     ← swipe right → left
 *   ╰──────────────────────────────╯ ╰──
 *
 * - Swipe (touch) or scroll sideways; each slide snaps into place.
 * - Moves on by itself every AUTOPLAY_MS, looping back to the first.
 * - Autoplay pauses while the user touches it, for a while after, when the
 *   tab is hidden, and never runs with "reduce motion" on.
 * - Dots are buttons too: tap one to jump to that slide.
 *
 * Each slide is full width (slides of different heights are stretched to the
 * tallest), with a small gap between them.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Time each slide shows before moving on by itself. */
const AUTOPLAY_MS = 5000;
/** After the user touches the carousel, wait this long before moving on again. */
const RESUME_AFTER_TOUCH_MS = 8000;

/** Dot colours: brand green on white cards, white on photos. */
const DOT_TONES = {
  brand: {
    active: "w-4 bg-brand-600 dark:bg-brand-400",
    inactive: "w-1.5 bg-neutral-300 dark:bg-white/25",
  },
  white: {
    active: "w-5 bg-white",
    inactive: "w-1.5 bg-white/50",
  },
} as const;

type CarouselProps = {
  /** Read by screen readers, e.g. "Offers and tips". */
  label: string;
  slides: { id: string; content: React.ReactNode }[];
  /** Where the dots sit over the slides, e.g. "top-5 right-5". */
  dotsClassName: string;
  dotsTone: keyof typeof DOT_TONES;
};

/** Index of the slide closest to the track's scroll position. */
function visibleIndex(track: HTMLElement): number {
  let closest = 0;
  let closestDistance = Infinity;
  Array.from(track.children).forEach((slide, index) => {
    const distance = Math.abs((slide as HTMLElement).offsetLeft - track.scrollLeft);
    if (distance < closestDistance) {
      closest = index;
      closestDistance = distance;
    }
  });
  return closest;
}

export function Carousel({ label, slides, dotsClassName, dotsTone }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const pausedUntil = useRef(0);

  const goTo = useCallback((index: number) => {
    const slide = trackRef.current?.children[index] as HTMLElement | undefined;
    if (!slide) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    trackRef.current?.scrollTo({ left: slide.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  // Which slide is showing, from the scroll position.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => setCurrent(visibleIndex(track));
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  // Autoplay (see the rules at the top of the file).
  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible" || Date.now() < pausedUntil.current) return;
      const track = trackRef.current;
      if (track) goTo((visibleIndex(track) + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length, goTo]);

  const pause = () => {
    pausedUntil.current = Date.now() + RESUME_AFTER_TOUCH_MS;
  };

  const tone = DOT_TONES[dotsTone];

  return (
    <section aria-roledescription="carousel" aria-label={label} className="relative">
      <div
        ref={trackRef}
        onPointerDown={pause}
        onTouchStart={pause}
        onWheel={pause}
        // `relative` so each slide's offsetLeft is measured from the track.
        className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            // `flex`: the slide's content stretches to the tallest slide.
            className="flex w-full shrink-0 snap-start snap-always"
          >
            {slide.content}
          </div>
        ))}
      </div>

      {/* The current slide's dot is a short bar. */}
      {slides.length > 1 && (
        <div className={cn("absolute flex items-center gap-1.5", dotsClassName)}>
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => {
                pause();
                goTo(index);
              }}
              className={cn(
                "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                index === current ? tone.active : tone.inactive,
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
