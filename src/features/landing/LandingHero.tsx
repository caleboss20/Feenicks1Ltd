import Image from "next/image";
import Link from "next/link";
import { LogoWordmark } from "@/components/brand/Logo";
import { PhoenixMark } from "@/components/brand/PhoenixMark";
import { ROUTES } from "@/config/routes";

/**
 * Landing page hero for laptops and desktops (lg and up). Phones see the
 * splash and the welcome slideshow instead (app/page.tsx).
 *
 * Laid out like investbamboo.com: a full-screen video with a soft dark
 * overlay, a white top bar floating over it, and the headline, one line and
 * one button centred in white.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ ╭────────────────────────────────────────────────────────────╮ │
 *   │ │ 🔥 Feenicks1   Portfolios & fees  Risks …   Log in (Get started) │ │
 *   │ ╰────────────────────────────────────────────────────────────╯ │
 *   │                     ░ video, full screen ░                     │
 *   │                       Grow your money,                         │
 *   │                     one cedi at a time.                        │
 *   │        Start investing from GH₵ 140 with Mobile Money…         │
 *   │                        ( Get started )                         │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Video: public/landing/hero.mp4 (Pexels 8275083, free licence), muted and
 * looping, with the first welcome photo as its poster. Reduce motion: the
 * photo only, no video. Inter Tight headline at weight 500, as on Bamboo.
 * No shadows (brand rule).
 */

/** Public pages only (no sign-in needed), so every link works for visitors. */
const NAV_LINKS = [
  { label: "Portfolios & fees", href: `${ROUTES.legal}/fees` },
  { label: "Risks", href: `${ROUTES.legal}/risk` },
  { label: "Privacy", href: `${ROUTES.legal}/privacy` },
  { label: "Complaints", href: `${ROUTES.legal}/complaints` },
  { label: "Legal", href: ROUTES.legal },
];

const POSTER = "/onboarding/individual.jpg";

export function LandingHero() {
  return (
    <main className="relative isolate flex h-dvh min-h-[40rem] flex-col overflow-hidden bg-brand-950 text-white">
      {/* The photo sits under the video: it shows while the video loads, and
          on its own for "reduce motion". */}
      <Image src={POSTER} alt="" fill priority sizes="100vw" quality={85} className="-z-20 object-cover object-[50%_12%]" />
      <video
        aria-hidden
        className="absolute inset-0 -z-20 size-full object-cover object-[50%_12%] motion-reduce:hidden"
        src="/landing/hero.mp4"
        poster={POSTER}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* Soft dark overlay so the white text always reads. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0.45)_45%,rgba(0,0,0,0.6))]" />

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

      <section className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
        <h1 className="font-display text-[clamp(3.25rem,5.6vw,5rem)] leading-[1.02] font-medium tracking-[-0.025em]">
          Grow your money,
          <br />
          one cedi at a time.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/85">
          At Feenicks1, we believe every cedi can become something more: a home, an education, a future.
        </p>
        <Link
          href={ROUTES.signUp}
          className="mt-9 flex h-14 items-center rounded-full bg-gold-500 px-9 text-base font-semibold text-brand-900 transition-colors hover:bg-gold-300"
        >
          Get started
        </Link>
      </section>
    </main>
  );
}
