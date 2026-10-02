/**
 * AppTabScreenLayout: frame for the main tab screens other than Home
 * (Analytics, Transactions, Account): a large left-aligned title, the
 * content, and the bottom tab bar.
 *
 *   Transactions                 ← large title
 *   …content…
 *   🏠  📊  🧾  👤                ← AppTabBar
 */

import { cn } from "@/lib/utils";
import { AppTabBar, appTabBarPadding } from "./AppTabBar";

export function AppTabScreenLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-5 pt-[max(1.5rem,env(safe-area-inset-top))]",
        appTabBarPadding,
      )}
    >
      <header>
        <h1 className="text-[1.625rem] leading-tight font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
        )}
      </header>
      <main className="mt-6 flex flex-col gap-6">{children}</main>
      <AppTabBar />
    </div>
  );
}
