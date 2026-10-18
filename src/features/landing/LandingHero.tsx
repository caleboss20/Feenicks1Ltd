"use client";

/**
 * Landing page hero for laptops and desktops (lg and up). Phones see the
 * splash and the welcome slideshow instead (app/page.tsx).
 *
 * Built like investbamboo.com and acorns.com:
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │  Invest from GH₵ 140 with Mobile Money.  Get started →          │ ← announcement banner
 *   │ ╭────────────────────────────────────────────────────────────╮ │
 *   │ │ 🔥 Feenicks1  Portfolios & fees  Risks …  Log in (Get started) │ │ ← floating top bar
 *   │ ╰────────────────────────────────────────────────────────────╯ │
 *   │ ‹              ░ full-screen video, per slide ░              › │ ← arrows
 *   │                    Headline, per slide                         │
 *   │                    Subtitle, per slide                         │
 *   │                      ( Get started )                           │
 *   │                          ● ○                                   │ ← dots
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Each slide's video plays to its end, then the next slide fades in (and
 * after the last, the first). The arrows and dots move at any time. Only the
 * visible slide's video plays. The keyboard's ← and → keys change slides from
 * anywhere on the page (no need to click it first). If a video can't play, the slide still moves
 * on after FALLBACK_MS. Reduce motion: no autoplay, no fades; the arrows still
 * work. Videos: Pexels (free licence), 1080p, in public/landing/.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoWordmark } from "@/components/brand/Logo";
import { PhoenixMark } from "@/components/brand/PhoenixMark";
import { ArrowRight, CloseIcon } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

/** Public pages only (no sign-in needed), so every link works for visitors. */
const NAV_LINKS = [
  { label: "Portfolios & fees", href: `${ROUTES.legal}/fees` },
  { label: "Risks", href: `${ROUTES.legal}/risk` },
  { label: "Privacy", href: `${ROUTES.legal}/privacy` },
  { label: "Complaints", href: `${ROUTES.legal}/complaints` },
  { label: "Legal", href: ROUTES.legal },
];

const SLIDES = [
  {
    video: "/landing/hero-coins.mp4", // Pexels 8369980
    headline: ["Watch your", "money grow."],
    subtitle: "Small amounts, invested well, become something bigger. Start with GH₵ 140.",
  },
  {
    video: "/landing/hero-sprout.mp4", // Pexels 7213898
    headline: ["Plant today.", "Harvest tomorrow."],
    subtitle: "Every cedi you invest is a seed. Give it time, and watch what it becomes.",
  },
  {
    video: "/landing/hero-family.mp4", // Pexels 5135876
    headline: ["Secure their future,", "starting today."],
    subtitle: "Put a little aside each month and build something your family can count on.",
  },
];

/** Moves on after this long only if a video can't play (normally: when it ends). */
const FALLBACK_MS = 15000;

function Arrow({ direction, onClick }: { direction: "previous" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "previous" ? "Previous slide" : "Next slide"}
      className={cn(
        // As on acorns.com: just the chevron, no circle or background.
        "absolute top-1/2 z-10 grid size-14 -translate-y-1/2 cursor-pointer place-items-center text-white/85 transition-colors hover:text-white",
        direction === "previous" ? "left-8" : "right-8",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={direction === "previous" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
      </svg>
    </button>
  );
}

export function LandingHero() {
  const [slide, setSlide] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  const go = (index: number) => setSlide((index + SLIDES.length) % SLIDES.length);

  // ← and → change slides from anywhere on the page, unless someone is typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") setSlide((current) => (current - 1 + SLIDES.length) % SLIDES.length);
      if (event.key === "ArrowRight") setSlide((current) => (current + 1) % SLIDES.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Only the visible slide's video plays, from the start (saves data and
  // battery). When it ends, onEnded moves on. If it can't play at all, the
  // fallback timer moves on instead.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let fallback: number | undefined;
    videos.current.forEach((video, index) => {
      if (!video) return;
      if (index !== slide) {
        video.pause();
        return;
      }
      video.currentTime = 0;
      const moveOnLater = () => {
        fallback = window.setTimeout(() => setSlide((current) => (current + 1) % SLIDES.length), FALLBACK_MS);
      };
      // A start can be interrupted (e.g. by a second call while the slide
      // changes); then try once more before giving up.
      video.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          window.setTimeout(() => void video.play().catch(moveOnLater), 250);
        } else moveOnLater();
      });
    });
    return () => window.clearTimeout(fallback);
  }, [slide]);

  return (
    <main
      className="relative isolate flex h-dvh min-h-[42rem] flex-col overflow-hidden bg-brand-950 text-white"
    >
      {/* Videos, stacked; the current one fades in. */}
      <div aria-hidden className="absolute inset-0 -z-20">
        {SLIDES.map((item, index) => (
          <video
            key={item.video}
            ref={(element) => {
              videos.current[index] = element;
            }}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-1000 motion-reduce:transition-none",
              index === slide ? "opacity-100" : "opacity-0",
            )}
            src={item.video}
            muted
            playsInline
            // The browser's own autoplay starts the first video even if the
            // play() call above runs before it's ready.
            autoPlay={index === 0}
            onEnded={() => go(index + 1)}
            preload={index === 0 ? "auto" : "metadata"}
          />
        ))}
      </div>
      {/* An even dark overlay over the whole video, as on investbamboo.com, so
          the white text always reads. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/50" />

      {/* Announcement banner, as on Bamboo and Acorns: bright blue, so it
          stands apart from the green and gold. ✕ hides it for this visit. */}
      {showBanner && (
        <div className="relative flex h-12 shrink-0 items-center justify-center bg-[#2346d8] text-white">
          <Link
            href={ROUTES.signUp}
            className="flex items-center gap-3 text-[0.9375rem] font-semibold transition-opacity hover:opacity-90"
          >
            Start investing from GH₵ 140 with Mobile Money.
            <span className="inline-flex items-center gap-1 rounded-full bg-white py-1 pr-2 pl-3 text-xs text-[#2346d8]">
              Get started
              <ArrowRight className="size-3.5" />
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            aria-label="Close this message"
            className="absolute right-4 grid size-8 cursor-pointer place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}

      {/* Floating top bar, as on Bamboo: white, inset 16px, rounded, no shadow. */}
      <header className="mx-4 mt-4 flex h-[5.25rem] shrink-0 items-center justify-between rounded-lg bg-white px-7 text-brand-900">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Feenicks1 home">
            <PhoenixMark tone="light" label={null} className="size-9" />
            <LogoWordmark tone="brand" decorative className="h-[1.375rem]" />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-[0.9375rem] font-semibold transition-colors hover:text-brand-600">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-7">
          <Link href={ROUTES.login} className="text-[0.9375rem] font-semibold transition-colors hover:text-brand-600">
            Log in
          </Link>
          <Link
            href={ROUTES.signUp}
            className="flex h-12 items-center rounded-full bg-brand-800 px-7 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Get started
          </Link>
        </div>
      </header>

      <section aria-roledescription="carousel" aria-label="Feenicks1" className="relative flex flex-1 flex-col items-center justify-end px-28 pb-[clamp(5rem,13vh,8.5rem)] text-center">
        <Arrow direction="previous" onClick={() => go(slide - 1)} />
        <Arrow direction="next" onClick={() => go(slide + 1)} />

        {/* Every slide's text in one grid cell: only the current one shows.
            Placed low on the screen, as on investbamboo.com (the headline
            starts a little past halfway down, the button near the bottom). */}
        <div className="grid">
          {SLIDES.map((item, index) => (
            <div
              key={item.video}
              aria-hidden={index !== slide}
              className={cn(
                "col-start-1 row-start-1 flex flex-col items-center transition-[opacity,translate] duration-700 motion-reduce:transition-none",
                index === slide ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
              )}
            >
              {index === 0 ? (
                <h1 className="font-display text-[clamp(3.25rem,5.6vw,5rem)] leading-[1.02] font-medium tracking-[-0.025em]">
                  {item.headline[0]}
                  <br />
                  {item.headline[1]}
                </h1>
              ) : (
                <p className="font-display text-[clamp(3.25rem,5.6vw,5rem)] leading-[1.02] font-medium tracking-[-0.025em]">
                  {item.headline[0]}
                  <br />
                  {item.headline[1]}
                </p>
              )}
              <p className="mt-6 max-w-[30rem] text-base leading-relaxed text-white/85">{item.subtitle}</p>
            </div>
          ))}
        </div>

        <Link
          href={ROUTES.signUp}
          className="mt-9 flex h-14 items-center rounded-full bg-gold-500 px-9 text-base font-semibold text-brand-900 transition-colors hover:bg-gold-300"
        >
          Get started
        </Link>

        {/* Dots */}
        <div className="absolute bottom-8 flex gap-2.5">
          {SLIDES.map((item, index) => (
            <button
              key={item.video}
              type="button"
              onClick={() => go(index)}
              aria-label={`Slide ${index + 1} of ${SLIDES.length}`}
              aria-current={index === slide}
              className={cn(
                "h-2 cursor-pointer rounded-full transition-all",
                index === slide ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
