import Image from "next/image";
import Link from "next/link";
import { LogoWordmark } from "@/components/brand/Logo";
import { PhoenixMark } from "@/components/brand/PhoenixMark";
import { ROUTES } from "@/config/routes";

/**
 * Landing page hero for laptops and desktops (lg and up). Phones see the
 * splash and the welcome slideshow instead (app/page.tsx).
 *
 * Laid out like the best investing sites (Acorns, Bamboo): centred, one
 * medium-weight headline, one short line, one button, then one big visual.
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ 🔥 Feenicks1    Portfolios & fees   Legal   Log in (Get started) │
 *   │                                                                │
 *   │                     Grow your money,                           │
 *   │                   one cedi at a time.                          │
 *   │        Start investing from GH₵ 140 with Mobile Money.         │
 *   │                      ( Get started )                           │
 *   │               Already have an account? Log in                  │
 *   │            ╭──────────────┬───────┬──────────────╮             │
 *   │            │  sage → gold │ phone │  band        │             │
 *   └────────────┴──────────────┴───────┴──────────────┴─────────────┘
 *
 * White, Inter Tight headline at weight 500 (large but not heavy), Inter
 * text. The phone shows a real screenshot of the Home screen
 * (public/landing/home-screen.jpg), rising from a soft band and cut off by
 * the bottom of the screen. No shadows (brand rule).
 */

const NAV_LINKS = [
  { label: "Portfolios & fees", href: `${ROUTES.legal}/fees` },
  { label: "Legal", href: ROUTES.legal },
];

export function LandingHero() {
  return (
    <main className="flex h-dvh min-h-[44rem] flex-col overflow-hidden bg-white text-brand-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Feenicks1 home">
          <PhoenixMark tone="light" label={null} className="size-8" />
          <LogoWordmark tone="brand" decorative className="h-5" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-9 text-[0.9375rem] font-medium text-neutral-600">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-brand-900">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <Link href={ROUTES.login} className="text-[0.9375rem] font-semibold text-brand-900 transition-colors hover:text-brand-600">
            Log in
          </Link>
          <Link
            href={ROUTES.signUp}
            className="flex h-11 items-center rounded-full bg-brand-800 px-6 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center px-8 pt-[clamp(2rem,6vh,4.5rem)] text-center">
        <h1 className="font-display text-[clamp(3rem,5.2vw,4.75rem)] leading-[1.04] font-medium tracking-[-0.025em]">
          Grow your money,
          <br />
          one cedi at a time.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
          Start investing from GH₵ 140 with Mobile Money, and watch it grow from your phone.
        </p>
        <Link
          href={ROUTES.signUp}
          className="mt-8 flex h-14 items-center rounded-full bg-brand-800 px-9 text-base font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Get started
        </Link>
        <p className="mt-4 text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href={ROUTES.login} className="font-semibold text-brand-800 hover:underline">
            Log in
          </Link>
        </p>

        {/* The phone rises from a soft band and is cut off by the screen's
            bottom edge, so the eye lands on the balance and the buttons. */}
        <div className="relative mt-10 flex w-full max-w-5xl flex-1 justify-center">
          <div aria-hidden className="absolute inset-x-0 top-24 bottom-0 rounded-t-[3rem] bg-[linear-gradient(135deg,var(--color-brand-100),var(--color-gold-50))]" />
          <div className="relative h-fit w-[19rem] rounded-[2.75rem] bg-neutral-950 p-2.5 xl:w-[20rem]">
            <div className="overflow-hidden rounded-[2.25rem]">
              <Image
                src="/landing/home-screen.jpg"
                alt="The Feenicks1 app's Home screen: portfolio value, profit earned, Invest and Withdraw buttons, and a performance chart"
                width={720}
                height={1408}
                priority
                sizes="320px"
                quality={90}
                className="block h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
