"use client";

/**
 * BannerCarousel: swipeable promo banners on the dashboard, like adverts.
 *
 *   ╭──────────────────────────────────────╮
 *   │ Invite a friend          [ photo ]   │   ← swipe right → left
 *   │ Earn GH₵ 20 …                         │
 *   │ ( Invite for free )            ▬ • • │   ← dots: which banner is showing
 *   ╰──────────────────────────────────────╯
 *
 * - Swipe (touch) or scroll horizontally; each banner snaps into place.
 * - Advances on its own every AUTOPLAY_MS, looping back to the first.
 * - Autoplay pauses while the user touches it, for a while after, when the
 *   tab is hidden, and never runs with "reduce motion" on.
 * - Dots are buttons too: tap one to jump to that banner.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Time each banner shows before moving on by itself. */
const AUTOPLAY_MS = 5000;
/** After the user touches the carousel, wait this long before auto-moving again. */
const RESUME_AFTER_TOUCH_MS = 8000;

export type Banner = {
  id: string;
  title: string;
  text: string;
  image: string;
  /**
   * Banner colour: a gradient [left, right] picked from the photo (e.g. the
   * colour of the person's clothes) so photo and colour blend. The left
   * colour sits behind the white text: keep it deep enough for contrast.
   */
  colors: [string, string];
  /** Focus point of the photo, e.g. "50% 25%". */
  imagePosition?: string;
  /** The banner's button: a link, or an action (e.g. sharing). */
  action: { label: string; href: string } | { label: string; onClick: () => Promise<"done" | "copied"> };
};

export function BannerCarousel({ banners, label }: { banners: Banner[]; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const pausedUntil = useRef(0);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  // Which banner is showing, from the scroll position.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => setCurrent(Math.round(track.scrollLeft / track.clientWidth));
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
      if (!track) return;
      const index = Math.round(track.scrollLeft / track.clientWidth);
      goTo((index + 1) % banners.length);
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
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[1.75rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner, index) => (
          <BannerSlide
            key={banner.id}
            banner={banner}
            position={`${index + 1} of ${banners.length}`}
          />
        ))}
      </div>

      {/* Dots, on the banner (bottom-right). The current one is a longer bar. */}
      {banners.length > 1 && (
        <div className="absolute right-5 bottom-4 flex items-center gap-1.5">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => {
                pause();
                goTo(index);
              }}
              className={cn(
                "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                index === current ? "w-5 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** One banner: text and button on the left, photo on the right fading into the banner colour. */
function BannerSlide({ banner, position }: { banner: Banner; position: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const buttonClass =
    "mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold transition-opacity hover:opacity-90";

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={position}
      className="relative isolate h-[9.25rem] w-full shrink-0 snap-center snap-always overflow-hidden text-white"
      style={{ backgroundImage: `linear-gradient(110deg, ${banner.colors[0]} 35%, ${banner.colors[1]})` }}
    >
      <Image
        src={banner.image}
        alt=""
        fill
        sizes="(min-width: 448px) 260px, 60vw"
        className="-z-10 left-auto! w-[58%]! object-cover [mask-image:linear-gradient(to_right,transparent,black_45%)]"
        style={{ objectPosition: banner.imagePosition ?? "50% 25%" }}
      />

      <div className="flex h-full flex-col justify-center px-5">
        <h2 className="text-base leading-tight font-semibold">{banner.title}</h2>
        <p className="mt-1 max-w-[11rem] text-xs leading-snug text-white/85">{banner.text}</p>
        <div>
          {"href" in banner.action ? (
            <Link href={banner.action.href} className={buttonClass} style={{ color: banner.colors[0] }}>
              {banner.action.label}
            </Link>
          ) : (
            <button
              type="button"
              className={buttonClass}
              style={{ color: banner.colors[0] }}
              onClick={async () => {
                if ("onClick" in banner.action && (await banner.action.onClick()) === "copied") {
                  setCopied(true);
                }
              }}
            >
              {copied ? (
                <>
                  <CheckIcon className="size-3.5" />
                  Link copied
                </>
              ) : (
                banner.action.label
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
