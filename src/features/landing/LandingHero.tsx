import Link from "next/link";
import { LogoWordmark } from "@/components/brand/Logo";
import { PhoenixMark } from "@/components/brand/PhoenixMark";
import { ROUTES } from "@/config/routes";

/**
 * Landing page hero for laptops and desktops (lg and up). Phones see the
 * splash and the welcome slideshow instead (app/page.tsx).
 *
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ 🔥 Feenicks1      Portfolios & fees  Legal      Log in [Create] │
 *   │                                                                │
 *   │  INVESTING MADE SIMPLE IN GHANA             ┌────────┐         │
 *   │  Grow your money,                           │ phone  │         │
 *   │  one cedi at a time.                        │ mock-up│         │
 *   │  Start from GH₵ 140 with Mobile Money…      │ of Home│         │
 *   │  [Create account]  [Log in]                 └────────┘         │
 *   │  ✓ PIN & 2FA  ✓ Verifiable statements  ✓ Mobile Money          │
 *   └────────────────────────────────────────────────────────────────┘
 *
 * Forest green with a soft gold glow; no shadows (brand rule). The phone is
 * drawn in HTML/CSS from the real Home screen's design (sharp at any size).
 * Its figures are illustrative and labelled as such for screen readers.
 */

const NAV_LINKS = [
  { label: "Portfolios & fees", href: `${ROUTES.legal}/fees` },
  { label: "Legal", href: ROUTES.legal },
];

const TRUST_POINTS = ["PIN and two-factor security", "Verifiable statements", "Pay in with Mobile Money"];

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-gold-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

/** The Home screen in a phone frame (illustrative figures). */
function PhoneMockup() {
  return (
    <div
      role="img"
      aria-label="The Feenicks1 app's home screen, showing a portfolio value and recent activity (illustrative figures)"
      className="relative w-[19rem] rounded-[3rem] bg-neutral-950 p-2.5 ring-1 ring-white/15 xl:w-[21rem]"
    >
      <div aria-hidden className="overflow-hidden rounded-[2.4rem] bg-[#f4f4ef]">
        {/* Forest header with the balance */}
        <div className="bg-[linear-gradient(to_bottom,#0a2e22,#0e3b2c)] px-5 pt-3 pb-6 text-white">
          <div className="flex items-center justify-between text-[0.625rem] font-semibold">
            <span>9:41</span>
            <span className="h-5 w-20 rounded-full bg-black" />
            <span>100%</span>
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-white/15 text-[0.625rem] font-semibold">AM</span>
            <div className="leading-tight">
              <p className="text-[0.625rem] text-white/70">Good morning</p>
              <p className="text-xs font-semibold">Ama</p>
            </div>
          </div>
          <p className="mt-5 text-[0.625rem] text-white/70">Portfolio value</p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
            <span className="text-lg">GH₵ </span>2,450<span className="text-white/60">.00</span>
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-2.5 py-1 text-[0.625rem] font-semibold text-brand-900">
            <span className="grid size-3.5 place-items-center rounded-full bg-brand-800 text-[0.5rem] text-gold-300">▲</span>
            Profit earned GH₵ 245.00
          </span>
          <div className="mt-4 grid grid-cols-[1fr_1fr_2.5rem] gap-2">
            <span className="rounded-xl bg-white py-2 text-center text-[0.625rem] font-semibold text-brand-900">+ Invest</span>
            <span className="rounded-xl bg-white py-2 text-center text-[0.625rem] font-semibold text-brand-900">↓ Withdraw</span>
            <span className="rounded-xl bg-gold-500" />
          </div>
        </div>
        {/* Recent activity */}
        <div className="px-5 pt-4 pb-6 text-neutral-900">
          <p className="text-xs font-semibold">Recent activity</p>
          {[
            { title: "Invested in InvestWise Capital", meta: "Today, 9:12 am", amount: "GH₵ 900.00" },
            { title: "Monthly return", meta: "1 Oct", amount: "+ GH₵ 72.40" },
            { title: "Invested in InvestWise Capital", meta: "12 Sep", amount: "GH₵ 1,550.00" },
          ].map((row) => (
            <div key={row.title + row.meta} className="mt-3.5 flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-[0.625rem] text-brand-800">↗</span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[0.6875rem] font-semibold">{row.title}</p>
                <p className="text-[0.5625rem] text-neutral-500">{row.meta}</p>
              </div>
              <span className="text-[0.6875rem] font-semibold tabular-nums">{row.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-brand-950 text-white">
      {/* Soft glows behind the content (gold behind the phone, green top left). */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(40%_55%_at_72%_55%,rgba(201,162,39,0.18),transparent_70%),radial-gradient(45%_50%_at_15%_10%,rgba(31,94,69,0.45),transparent_70%)]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Feenicks1 home">
          <PhoenixMark label={null} className="size-9" />
          <LogoWordmark tone="gold" decorative className="h-5" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-8 text-sm font-medium text-white/75">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href={ROUTES.login} className="rounded-full px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:text-white">
            Log in
          </Link>
          <Link
            href={ROUTES.signUp}
            className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:bg-gold-300"
          >
            Create account
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-[1.1fr_1fr] items-center gap-12 px-8 pb-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">Investing made simple in Ghana</p>
          <h1 className="mt-5 font-display text-[clamp(2.75rem,4.4vw,4rem)] leading-[1.02] font-semibold tracking-[-0.03em]">
            Grow your money,
            <br />
            <span className="text-gold-500">one cedi at a time.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75">
            Start investing from GH₵ 140 with Mobile Money. Four portfolios, clear fees, and withdrawals on published
            terms, all from your phone.
          </p>
          <div className="mt-9 flex items-center gap-3">
            <Link
              href={ROUTES.signUp}
              className="rounded-full bg-gold-500 px-7 py-3.5 text-[0.9375rem] font-semibold text-brand-900 transition-colors hover:bg-gold-300"
            >
              Create account
            </Link>
            <Link
              href={ROUTES.login}
              className="rounded-full px-7 py-3.5 text-[0.9375rem] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/5"
            >
              Log in
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <Check />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center">
          <PhoneMockup />
        </div>
      </section>
    </main>
  );
}
