import type { InvestmentPackage } from "@/features/packages/investmentPackages";
import { cn } from "@/lib/utils";
import { formatWalletId, type PackageWallet } from "./walletModel";

/**
 * The package wallet as a card, after the user's bank-card reference, in
 * our green and with our details (never a card network's):
 *
 *   ╭──────────────────────────────────────╮
 *   │ FEENICKS1                         IC │   ← the package code, like a card brand
 *   │                                      │
 *   │ F1 IC 4821 7365                      │   ← wallet ID; "F1 CAPITAL" huge and
 *   │                                      │      faded behind (watermark)
 *   │ Wallet holder        Opened          │
 *   │ Ama Mensah           7 Oct 2026      │   ← full name from Fill your profile
 *   ╰──────────────────────────────────────╯
 *
 * The balance sits above the card on the screen, not on it.
 */
export function WalletCard({
  wallet,
  pkg,
  holderName,
  className,
}: {
  wallet: PackageWallet;
  pkg: InvestmentPackage;
  holderName: string;
  className?: string;
}) {
  // When the wallet was opened (the package chosen): a wallet has no expiry, so this takes that place.
  const openedLabel = new Date(wallet.createdAt).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section
      aria-label={`${pkg.name} wallet, ID ${formatWalletId(wallet.id)}`}
      className={cn(
        // A bank card's proportions (85.6 × 54 mm).
        "@container relative isolate aspect-[1.586] w-full overflow-hidden rounded-xl p-5 text-white",
        "bg-[linear-gradient(135deg,#2fbf71_0%,#13934f_45%,#0b5e33_100%)]",
        className,
      )}
    >
      {/* "F1 CAPITAL", big, slanted and faded across the middle of the card, like the VISA
          behind the reference card. Sized to the card (cqw) so the whole word always shows. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[70%] -z-10 -translate-y-1/2 -skew-x-12 text-center text-[clamp(2.5rem,16cqw,4rem)] leading-none font-black whitespace-nowrap text-white/[0.11] italic select-none"
      >
        F1 CAPITAL
      </span>
      {/* A soft light from the top left, for depth. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 -z-10 size-64 rounded-full bg-white/10 blur-2xl"
      />

      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between">
          <span className="text-[0.6875rem] font-semibold tracking-[0.18em] text-white/85">FEENICKS1</span>
          <span className="text-[1.75rem] leading-none font-black tracking-tight italic">{pkg.ticker}</span>
        </div>

        <p className="mt-auto text-[1.25rem] font-semibold tracking-[0.14em] tabular-nums max-[360px]:text-lg">
          {formatWalletId(wallet.id)}
        </p>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.6875rem] text-white/65">Wallet holder</p>
            <p className="mt-0.5 truncate text-sm font-semibold">{holderName}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.6875rem] text-white/65">Opened</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">{openedLabel}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
