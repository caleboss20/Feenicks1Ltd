"use client";

/**
 * BannerCarousel: swipeable white cards on the dashboard, after the "Bill
 * negotiator" card in the user's reference.
 *
 *   ╭──────────────────────────────────────╮
 *   │ 🎁 Invite a friend            ▬ • •  │   ← dots: which card is showing
 *   │ ╭──────────────────────────────────╮ │
 *   │ │ Earn GH₵ 20 for every friend …   │ │   ← soft grey box with the message
 *   │ │ ╭──────────────────────────────╮ │ │
 *   │ │ │      Invite for free  →      │ │ │   ← full-width white button
 *   │ │ ╰──────────────────────────────╯ │ │
 *   │ ╰──────────────────────────────────╯ │
 *   ╰──────────────────────────────────────╯
 *
 * - Swipe (touch) or scroll horizontally; each card snaps into place.
 * - Advances on its own every AUTOPLAY_MS, looping back to the first.
 * - Autoplay pauses while the user touches it, for a while after, when the
 *   tab is hidden, and never runs with "reduce motion" on.
 * - Dots are buttons too: tap one to jump to that card.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Time each card shows before moving on by itself. */
const AUTOPLAY_MS = 5000;
/** After the user touches the carousel, wait this long before auto-moving again. */
const RESUME_AFTER_TOUCH_MS = 8000;

export type Banner = {
  id: string;
  /** Small icon before the title, shown in brand green. */
  icon: React.ReactNode;
  title: string;
  /** The message in the grey box. Wrap the key part in <strong> to highlight it. */
  text: React.ReactNode;
  /** The card's button: a link, or an action (e.g. sharing). */
  action: { label: string; href: string } | { label: string; onClick: () => Promise<"done" | "copied"> };
};

/** Index of the card closest to the track's scroll position. */
function visibleIndex(track: HTMLElement): number {
  let closest = 0;
  let closestDistance = Infinity;
  Array.from(track.children).forEach((card, index) => {
    const distance = Math.abs((card as HTMLElement).offsetLeft - track.scrollLeft);
    if (distance < closestDistance) {
      closest = index;
      closestDistance = distance;
    }
  });
  return closest;
}

export function BannerCarousel({ banners, label }: { banners: Banner[]; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const pausedUntil = useRef(0);

  const goTo = useCallback((index: number) => {
    const card = trackRef.current?.children[index] as HTMLElement | undefined;
    if (!card) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    trackRef.current?.scrollTo({ left: card.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  // Which card is showing, from the scroll position.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => setCurrent(visibleIndex(track));
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  // Autoplay (see the rules at the top of the file).
  useEffect(() => {
    if (banners.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible" || Date.now() < pausedUntil.current) return;
      const track = trackRef.current;
      if (track) goTo((visibleIndex(track) + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length, goTo]);

  const pause = () => {
    pausedUntil.current = Date.now() + RESUME_AFTER_TOUCH_MS;
  };

  return (
    <section aria-roledescription="carousel" aria-label={label} className="relative">
      <div
        ref={trackRef}
        onPointerDown={pause}
        onTouchStart={pause}
        onWheel={pause}
        // `relative` so each card's offsetLeft is measured from the track.
        className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner, index) => (
          <BannerCard key={banner.id} banner={banner} position={`${index + 1} of ${banners.length}`} />
        ))}
      </div>

      {/* Dots, top-right of the card, level with its title. The current one is a short bar. */}
      {banners.length > 1 && (
        <div className="absolute top-[1.375rem] right-5 flex items-center gap-1.5">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Show card ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => {
                pause();
                goTo(index);
              }}
              className={cn(
                "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                index === current
                  ? "w-4 bg-brand-600 dark:bg-brand-400"
                  : "w-1.5 bg-neutral-300 dark:bg-white/25",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** One white card: icon and title, then a grey box with the message and a button. */
function BannerCard({ banner, position }: { banner: Banner; position: string }) {
  const [copied, setCopied] = useState(false);

  // Put the button back to its label after a moment.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const buttonClass =
    "group mt-3.5 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-background text-[0.8125rem] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5";
  const arrow = <ArrowRight className="size-4" />;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={position}
      className="flex w-full shrink-0 snap-start snap-always flex-col rounded-3xl border border-neutral-200/80 bg-background p-2.5 dark:border-white/10"
    >
      {/* Room on the right for the dots. */}
      <div className="flex items-center gap-2 px-2 pt-1 pr-16 pb-2.5">
        <span className="text-brand-600 dark:text-brand-400 [&_svg]:size-[18px]">{banner.icon}</span>
        <h2 className="truncate text-sm font-semibold">{banner.title}</h2>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl border border-neutral-100 bg-neutral-50 p-3.5 dark:border-white/5 dark:bg-white/5">
        <p className="flex-1 text-[0.8125rem] leading-relaxed text-neutral-600 dark:text-neutral-300 [&_strong]:font-semibold [&_strong]:text-neutral-900 dark:[&_strong]:text-white">
          {banner.text}
        </p>
        {"href" in banner.action ? (
          <Link href={banner.action.href} className={buttonClass}>
            {banner.action.label}
            {arrow}
          </Link>
        ) : (
          <button
            type="button"
            className={buttonClass}
            onClick={async () => {
              if ("onClick" in banner.action && (await banner.action.onClick()) === "copied") {
                setCopied(true);
              }
            }}
          >
            {copied ? (
              <>
                <CheckIcon className="size-4 text-brand-600" />
                Link copied
              </>
            ) : (
              <>
                {banner.action.label}
                {arrow}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
