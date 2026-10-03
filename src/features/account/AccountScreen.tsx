"use client";

/**
 * Account tab, after the user's reference (a "Profile" screen): a light grey
 * page with white rounded cards.
 *
 *   (←)            Account            (🔔)
 *   ╭────────────────────────────────────╮
 *   │ (📷) Ama                          › │   ← opens Edit profile
 *   │      @ama_m (or their email)        │
 *   ╰────────────────────────────────────╯
 *   ╭── Invite a friend (photo cards) ───╮   ← swipeable; where the reference
 *   ╰────────────────────────────────────╯     has "Upgrade to Pro"
 *   ╭────────────────────────────────────╮
 *   │ 🧭 Investor profile    Moderate  › │
 *   │ ▦  Investment packages            › │
 *   │ ↓  Withdraw                       › │
 *   ╰────────────────────────────────────╯
 *   ╭────────────────────────────────────╮
 *   │ ☝  Unlock with fingerprint   (●) │   ← real toggle (this device)
 *   │ 🔑 Reset PIN                      › │
 *   │ 🔔 Notifications                  › │
 *   ╰────────────────────────────────────╯
 *   ╭────────────────────────────────────╮
 *   │ ☾  Dark mode                  (  ●) │   ← light by default
 *   ╰────────────────────────────────────╯
 *   ╭────────────────────────────────────╮
 *   │ 🎧 Help & support                 › │
 *   ╰────────────────────────────────────╯
 *   ╭────────────────────────────────────╮
 *   │ ⇥  Log out                          │   ← red; asks "Log out?" first
 *   ╰────────────────────────────────────╯
 *
 * Only rows that work today: more (privacy policy, language…) get added as
 * those features are built.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BellIcon,
  ChevronDownIcon,
  CompassIcon,
  FaceIdIcon,
  FingerprintIcon,
  GridIcon,
  KeyIcon,
  LogoutIcon,
  MoonIcon,
  SupportIcon,
} from "@/components/icons";
import { AppTabBar, appTabBarPadding } from "@/components/layout/AppTabBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Switch } from "@/components/ui/Switch";
import { ROUTES } from "@/config/routes";
import { logOut } from "@/features/auth/authService";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { RISK_LEVELS } from "@/features/investor-profile/riskProfileQuestions";
import { InviteCarousel } from "@/features/referrals/InviteCarousel";
import { disableBiometricUnlock, enableBiometricUnlock } from "@/features/security/securityService";
import { useBiometricSupport } from "@/features/security/useBiometricSupport";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { guessBiometricKind } from "@/lib/webAuthn";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/useThemeStore";
import { ACCOUNT_PAGE_COLORS } from "./accountTheme";

/** Company website, for "Help & support" until in-app support exists. */
const SUPPORT_URL = "https://www.feenicks1solutions.com";

export function AccountScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const [isConfirmingLogOut, setIsConfirmingLogOut] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  useStatusBarColor(ACCOUNT_PAGE_COLORS);

  // Always signed in here (AppLockGuard); this just narrows the type.
  if (current.status !== "signed-in") return null;
  const { email, firstName, username, avatarUrl, riskLevel, hasBiometrics } = current.account;

  const handleLogOut = async () => {
    setIsLoggingOut(true);
    await logOut();
    router.replace(ROUTES.login);
  };

  const circleButton =
    "grid size-11 shrink-0 place-items-center rounded-full bg-black/5 transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15";

  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-neutral-100 px-4 pt-[max(1rem,env(safe-area-inset-top))] dark:bg-background",
        appTabBarPadding,
      )}
    >
      {/* Back to Home · title · notifications */}
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center pb-2">
        <Link href={ROUTES.dashboard} aria-label="Back to home" className={circleButton}>
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-center text-[1.0625rem] font-semibold">Account</h1>
        <Link href={ROUTES.notifications} aria-label="Notifications" className={circleButton}>
          <BellIcon className="size-5" />
        </Link>
      </header>

      {/* Who's logged in: opens Edit profile. */}
      <Link
        href={ROUTES.editProfile}
        aria-label="Edit profile"
        className="group flex items-center gap-3.5 rounded-3xl bg-white px-4 py-4 transition-colors hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={52}
            height={52}
            unoptimized // a small local thumbnail: nothing to optimise
            className="size-13 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="grid size-13 shrink-0 place-items-center rounded-full bg-brand-50 text-base font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
          >
            {(firstName ?? "F1").slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{firstName ?? "Your account"}</p>
          <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
            {username ? `@${username}` : email}
          </p>
        </div>
        <ChevronDownIcon className="size-[18px] -rotate-90 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
      </Link>

      {/* Invite friends, where the reference has "Upgrade to Pro". */}
      <InviteCarousel email={email} />

      <RowGroup>
        <LinkRow
          icon={<CompassIcon />}
          label="Investor profile"
          value={riskLevel ? RISK_LEVELS[riskLevel].name : "Not set"}
          // In-app versions (never the sign-up screens); without a profile it opens the questions.
          href={ROUTES.investorProfile}
        />
        <LinkRow icon={<GridIcon />} label="Investment packages" href={ROUTES.invest} />
        <LinkRow icon={<ArrowRight className="rotate-90" />} label="Withdraw" href={ROUTES.withdraw} />
      </RowGroup>

      <RowGroup>
        <BiometricUnlockRow isOn={hasBiometrics} />
        <LinkRow icon={<KeyIcon />} label="Reset PIN" href={ROUTES.forgotPin} />
        <LinkRow icon={<BellIcon />} label="Notifications" href={ROUTES.notifications} />
      </RowGroup>

      <RowGroup>
        <DarkModeRow />
      </RowGroup>

      <RowGroup>
        <LinkRow icon={<SupportIcon />} label="Help & support" href={SUPPORT_URL} external />
      </RowGroup>

      <RowGroup>
        <li>
          <button
            type="button"
            // Asks first (ConfirmDialog below).
            onClick={() => setIsConfirmingLogOut(true)}
            className="flex min-h-14 w-full cursor-pointer items-center gap-3.5 py-3.5 text-[0.9375rem] font-medium text-red-600 dark:text-red-400 [&_svg]:size-5"
          >
            <LogoutIcon />
            Log out
          </button>
        </li>
      </RowGroup>

      <ConfirmDialog
        open={isConfirmingLogOut}
        tone="danger"
        icon={<LogoutIcon />}
        title="Log out?"
        message="You'll need your email and password to log back in."
        confirmLabel="Log out"
        isConfirming={isLoggingOut}
        onConfirm={handleLogOut}
        onCancel={() => setIsConfirmingLogOut(false)}
      />

      <AppTabBar />
    </div>
  );
}

/** A white rounded card of rows, with thin lines between them. */
function RowGroup({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y divide-neutral-100 rounded-3xl bg-white px-4 dark:divide-white/10 dark:bg-white/5">
      {children}
    </ul>
  );
}

const rowClass = "flex min-h-14 items-center gap-3.5 py-3.5";
const iconClass = "shrink-0 text-neutral-600 dark:text-neutral-300 [&_svg]:size-5";

/** A row that opens a screen (or an external site): icon, label, optional value, chevron. */
function LinkRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  href: string;
  external?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={cn(rowClass, "group")}
      >
        <span className={iconClass}>{icon}</span>
        <span className="min-w-0 flex-1 truncate text-[0.9375rem]">{label}</span>
        {value && <span className="text-sm text-neutral-500 dark:text-neutral-400">{value}</span>}
        {/* Chevron turned to point right ("open"). */}
        <ChevronDownIcon className="size-[18px] -rotate-90 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

/**
 * Dark mode on or off. Light is the default; the choice is saved on this
 * device and applied before the page paints on the next visit (useThemeStore).
 */
function DarkModeRow() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <li className={rowClass}>
      <span className={iconClass}>
        <MoonIcon />
      </span>
      <span className="min-w-0 flex-1 text-[0.9375rem]">Dark mode</span>
      <Switch
        checked={theme === "dark"}
        onChange={(isOn) => setTheme(isOn ? "dark" : "light")}
        label="Dark mode"
      />
    </li>
  );
}

/**
 * "Unlock with fingerprint / Face ID", on or off for this account on this
 * device. Turning it on shows the phone's own prompt; turning it off means
 * the PIN unlocks the app. Greyed out when the device can't do it.
 */
function BiometricUnlockRow({ isOn }: { isOn: boolean }) {
  const isSupported = useBiometricSupport();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kind = guessBiometricKind();
  const label = kind === "face" ? "Unlock with Face ID" : "Unlock with fingerprint";

  const toggle = async (turnOn: boolean) => {
    setIsBusy(true);
    setError(null);
    const result = turnOn ? await enableBiometricUnlock() : await disableBiometricUnlock();
    if (!result.ok) setError(result.message);
    setIsBusy(false);
  };

  const unavailable = isSupported === false && !isOn;

  return (
    <li className={rowClass}>
      <span className={iconClass}>{kind === "face" ? <FaceIdIcon /> : <FingerprintIcon />}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem]">{label}</span>
        {(unavailable || error) && (
          <span
            role={error ? "alert" : undefined}
            className={cn(
              "mt-0.5 block text-xs",
              error ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400",
            )}
          >
            {error ?? "Not available on this device"}
          </span>
        )}
      </span>
      <Switch
        checked={isOn}
        onChange={toggle}
        label={label}
        // Still checking the device, busy, or the device can't (unless it's on: it can always be turned off).
        disabled={isBusy || isSupported === null || unavailable}
      />
    </li>
  );
}
