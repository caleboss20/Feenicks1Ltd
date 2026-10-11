import { EyeIcon, EyeOffIcon } from "@/components/icons";
import type { InvestmentPackage } from "@/features/packages/investmentPackages";
import { CEDI_SYMBOL, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { formatWalletId, type PackageWallet } from "./walletModel";

/**
 * The package wallet as a card, after the user's bank-card reference (the
 * blue VISA card), in our green and with our details, never a card network's:
 *
 *   ╭──────────────────────────────────────────╮
 *   │ IC                                  [▦]  │   ← package code where VISA sits; a chip
 *   │                                    ((( │
 *   │ GH₵ 1,500.00                        👁  ((│   ← the balance; the eye hides amounts
 *   │                                    ((( │      (rings: background decoration)
 *   │ Holder        Wallet ID                  │   ← like Exp / Number
 *   │ Ama Mensah    F1 IC 4821 7365            │
 *   ╰──────────────────────────────────────────╯
 *
 * The holder is the full name from Fill your profile. The wallet ID starts
 * with F1 and the package code, so it can't be mistaken for a bank card number.
 */
export function WalletCard({
  wallet,
  pkg,
  holderName,
  balance,
  hideAmounts,
  onToggleHideAmounts,
  className,
}: {
  wallet: PackageWallet;
  pkg: InvestmentPackage;
  holderName: string;
  /** What's in the wallet, in GH₵. */
  balance: number;
  hideAmounts: boolean;
  onToggleHideAmounts: () => void;
  className?: string;
}) {
  return (
    <section
      aria-label={`${pkg.name} wallet, ID ${formatWalletId(wallet.id)}`}
      className={cn(
        "relative isolate flex aspect-[1.75] w-full flex-col overflow-hidden rounded-xl p-5 text-white",
        "bg-[linear-gradient(135deg,#2a6b50_0%,#164a39_50%,#0e3b2c_100%)]",
        className,
      )}
    >
      {/* Soft rings on the right, like the reference's background. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 -right-[35%] -z-10 aspect-square h-[190%] -translate-y-1/2 rounded-full bg-[repeating-radial-gradient(circle,rgba(255,255,255,0.07)_0_14%,transparent_14%_22%)]"
      />

      <div className="flex items-start justify-between">
        <span className="text-[1.75rem] leading-none font-black tracking-tight italic">{pkg.ticker}</span>
        <CardChip />
      </div>

      <div className="mt-auto flex items-center justify-between gap-4">
        <p className="flex items-baseline gap-1.5 font-bold tracking-tight tabular-nums">
          <span className="text-lg text-white/75">{CEDI_SYMBOL}</span>
          <span className="text-[1.875rem] leading-none max-[360px]:text-[1.625rem]">
            {hideAmounts ? "••••" : formatCedisNumber(balance, { exact: true })}
          </span>
          <span className="sr-only">{hideAmounts ? "Balance hidden" : "Balance"}</span>
        </p>
        <button
          type="button"
          onClick={onToggleHideAmounts}
          aria-pressed={hideAmounts}
          aria-label={hideAmounts ? "Show amounts" : "Hide amounts"}
          className="-m-2 cursor-pointer p-2 text-white/85 transition-colors hover:text-white"
        >
          {hideAmounts ? <EyeOffIcon className="size-6" /> : <EyeIcon className="size-6" />}
        </button>
      </div>

      <div className="mt-auto flex items-end gap-6">
        <div className="min-w-0">
          <p className="text-[0.6875rem] text-white/65">Holder</p>
          <p className="mt-0.5 max-w-[8rem] truncate text-[0.8125rem] font-semibold">{holderName}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[0.6875rem] text-white/65">Wallet ID</p>
          <p className="mt-0.5 text-[0.8125rem] font-semibold whitespace-nowrap tabular-nums">
            {formatWalletId(wallet.id)}
          </p>
        </div>
      </div>
    </section>
  );
}

/** A card chip: a small lime square with contact lines (decoration only). */
function CardChip() {
  return (
    <svg aria-hidden viewBox="0 0 44 34" className="h-8 w-[2.6rem] shrink-0">
      <rect x="0.5" y="0.5" width="43" height="33" rx="6" fill="#d4f24a" />
      <path
        d="M15 1v9m14-9v9M15 24v9m14-9v9M1 12h12m18 0h12M1 22h12m18 0h12M13 10h18v14H13z"
        fill="none"
        stroke="#9fbf1e"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
