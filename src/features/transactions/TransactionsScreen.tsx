"use client";

/**
 * Transactions tab: every deposit, investment, profit payment and withdrawal.
 *
 *   Transactions
 *   ┌ 🧾 No transactions yet ─────────────┐
 *   │ Your deposits, investments, returns  │
 *   │ and withdrawals will show here.       │
 *   │ ( Make your first investment )        │
 *   └───────────────────────────────────────┘
 *
 * TODO(invest): the list (icon, title, transaction ID, date, amount,
 * status), grouped by date, with filters, once investing exists.
 */

import Link from "next/link";
import { ReceiptIcon } from "@/components/icons";
import { AppTabScreenLayout } from "@/components/layout/AppTabScreenLayout";
import { ROUTES } from "@/config/routes";

export function TransactionsScreen() {
  return (
    <AppTabScreenLayout title="Transactions" subtitle="Your deposits, investments and returns.">
      <section className="flex flex-col items-center rounded-3xl border border-neutral-100 px-6 py-12 text-center dark:border-white/10">
        <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
          <ReceiptIcon className="size-6" />
        </span>
        <h2 className="mt-4 text-base font-semibold">No transactions yet</h2>
        <p className="mt-1.5 max-w-64 text-[0.8125rem] leading-relaxed text-neutral-500">
          Your deposits, investments, returns and withdrawals will show here.
        </p>
        <Link
          href={ROUTES.packages}
          className="mt-5 inline-flex h-10 items-center rounded-full bg-brand-600 px-5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Make your first investment
        </Link>
      </section>
    </AppTabScreenLayout>
  );
}
