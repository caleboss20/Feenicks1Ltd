"use client";

/**
 * AppTabBar: the app's main navigation, a plain bar across the bottom (icon
 * above label). The tab for the current page is in the user's dashboard
 * colour (Account › Dashboard colour; green by default), the others grey.
 *
 *   🏠 Home   📊 Analytics   🧾 Transactions   👤 Account
 *
 * Used by every main app screen. Screens using it need bottom padding so
 * their content isn't hidden behind it: `appTabBarPadding`.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBarIcon, HomeIcon, ReceiptIcon, UserIcon } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home", href: ROUTES.dashboard, icon: <HomeIcon /> },
  { label: "Analytics", href: ROUTES.analytics, icon: <ChartBarIcon /> },
  { label: "Transactions", href: ROUTES.transactions, icon: <ReceiptIcon /> },
  { label: "Account", href: ROUTES.account, icon: <UserIcon /> },
];

/** Bottom padding for a screen that shows the tab bar (bar height + phone safe area). */
export const appTabBarPadding = "pb-[calc(5.5rem+env(safe-area-inset-bottom))]";

export function AppTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      style={
        {
          // The current tab is always the app's green: the colour chosen in
          // Account › Dashboard colour is for the dashboard's top only.
          "--tab-active": "var(--color-brand-600)",
          "--tab-active-dark": "var(--color-brand-400)",
        } as React.CSSProperties
      }
      className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-100 bg-background pb-[env(safe-area-inset-bottom)] dark:border-white/10"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <li key={tab.label}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors [&_svg]:size-[22px]",
                  isActive
                    ? "font-semibold text-(--tab-active) dark:text-(--tab-active-dark)"
                    : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300",
                )}
              >
                {tab.icon}
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
