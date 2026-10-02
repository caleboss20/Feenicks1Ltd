/**
 * Withdraw: opened from the dashboard's Withdraw button.
 *
 *   ← Withdraw
 *   ┌──────────────────────────────┐
 *   │ Available to withdraw        │
 *   │ GH₵ 0.00                     │
 *   └──────────────────────────────┘
 *            (↓)
 *     Nothing to withdraw yet
 *     Once you invest, …
 *
 *   (        Invest now        )
 *
 * Honest by design: the balance is GH₵ 0.00 until investing exists.
 * TODO(withdraw): the real flow (amount, Mobile Money or bank account,
 * confirm with PIN) once investments and payouts are built.
 */

import { ArrowRight } from "@/components/icons";
import { StepScreenLayout, stepActionsClass } from "@/components/layout/StepScreenLayout";
import { ButtonLink } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";
import { formatCedis } from "@/lib/money";

/** TODO(withdraw): the user's withdrawable returns, from the server. */
const AVAILABLE_TO_WITHDRAW = 0;

export function WithdrawScreen() {
  return (
    <StepScreenLayout title="Withdraw" backHref={ROUTES.dashboard}>
      <section className="rounded-3xl bg-neutral-50 px-5 py-6 dark:bg-white/5">
        <p className="text-[0.8125rem] text-neutral-500 dark:text-neutral-400">
          Available to withdraw
        </p>
        <p className="mt-2 text-[2rem] leading-tight font-bold tracking-tight">
          {formatCedis(AVAILABLE_TO_WITHDRAW, { exact: true })}
        </p>
      </section>

      <div className="mt-12 flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
          <ArrowRight className="size-7 rotate-90" />
        </span>
        <h2 className="mt-5 text-lg font-semibold">Nothing to withdraw yet</h2>
        <p className="mt-2 max-w-72 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Once you invest, you can withdraw your returns monthly, or every 3 or 6 months,
          depending on your package.
        </p>
      </div>

      <div className={stepActionsClass}>
        <ButtonLink href={ROUTES.packages} size="lg" fullWidth>
          Invest now
        </ButtonLink>
      </div>
    </StepScreenLayout>
  );
}
