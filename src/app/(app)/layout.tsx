import { AppLockGuard } from "@/features/security/AppLockGuard";

/**
 * Layout for the app itself (`(app)` is a route group: it doesn't appear in
 * URLs). Every screen for registered users goes in this folder: dashboard
 * now; portfolio, deposits, withdrawals and settings later.
 *
 * AppLockGuard: logged-in, registered and unlocked users only, plus
 * auto-lock after 5 minutes without activity.
 */
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppLockGuard>{children}</AppLockGuard>
    </div>
  );
}
