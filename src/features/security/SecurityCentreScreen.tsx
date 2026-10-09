"use client";

/**
 * Security centre (Account › Security centre): everything that protects
 * the account, in one place.
 *
 *   ╭──────────────────────────────────────────╮
 *   │ (🛡)  Account protection                  │
 *   │      Strong · 4 of 4 protections on      │
 *   │      ▬▬▬▬ ▬▬▬▬ ▬▬▬▬ ▬▬▬▬                  │
 *   ╰──────────────────────────────────────────╯
 *   PROTECTIONS    App PIN · Fingerprint/Face ID · Two-step log-in · Phone
 *   SIGNED-IN DEVICES   Chrome on Android · This device · Active now
 *                       (Sign out of other devices)
 *   RECENT ACTIVITY     Logged in · PIN changed · …  (device, date)
 *   ╭ Feenicks1 will never ask for your PIN… ╮      ← scam warning
 *
 * Devices and activity: securityActivity.ts (TODO(api): from the server).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyIcon, PhoneIcon, ShieldCheckIcon } from "@/components/icons";
import { StepScreenLayout } from "@/components/layout/StepScreenLayout";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ROUTES } from "@/config/routes";
import { BiometricUnlockRow } from "@/features/account/AccountScreen";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { maskGhanaPhone } from "@/lib/maskContactDetails";
import { cn } from "@/lib/utils";
import {
  getSecurityActivity,
  SECURITY_EVENT_TITLES,
  signOutOtherDevices,
  thisDeviceId,
  touchThisDevice,
  type KnownDevice,
  type SecurityEvent,
} from "./securityActivity";
import { SECTION_LABEL } from "@/components/ui/styles";

const LABEL = SECTION_LABEL;
const CARD = "divide-y divide-neutral-100 rounded-3xl border border-neutral-200 px-4 dark:divide-white/10 dark:border-white/10";
const ROW = "flex min-h-14 items-center gap-3.5 py-3.5";
const ICON = "shrink-0 text-neutral-600 dark:text-neutral-300 [&_svg]:size-5";

const TWO_FACTOR_NAMES = { sms: "SMS code", "authenticator-app": "Authenticator app", biometric: "Fingerprint / Face ID" } as const;

function when(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}, ${time}`;
}

export function SecurityCentreScreen() {
  const router = useRouter();
  const current = useCurrentAccount();
  const email = current.status === "signed-in" ? current.account.email : null;
  const [activity, setActivity] = useState<{ devices: KnownDevice[]; events: SecurityEvent[] }>({ devices: [], events: [] });
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // This device counts as active now; then read the list.
  useEffect(() => {
    if (!email) return;
    touchThisDevice(email);
    const load = window.setTimeout(() => {
      setDeviceId(thisDeviceId());
      setActivity(getSecurityActivity(email));
    }, 0);
    return () => window.clearTimeout(load);
  }, [email]);

  const back = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.account));
  if (current.status !== "signed-in") return null;
  const account = current.account;

  const checks = [
    { done: true },
    { done: account.hasBiometrics },
    { done: account.twoFactorMethod !== null },
    { done: account.phone !== null },
  ];
  const doneCount = checks.filter((check) => check.done).length;
  const level = doneCount === 4 ? "Strong" : doneCount === 3 ? "Good" : "Basic";
  const others = activity.devices.filter((device) => device.id !== deviceId);

  const confirmSignOut = () => {
    signOutOtherDevices(account.email);
    setActivity(getSecurityActivity(account.email));
    setIsConfirming(false);
  };

  return (
    <StepScreenLayout title="Security centre" centeredTitle stickyHeader onBack={back}>
      <div className="flex flex-1 flex-col pb-8 sm:flex-none">
        {/* Protection level */}
        <section className="mt-1 rounded-3xl bg-brand-50 p-5 dark:bg-brand-500/10" aria-label="Account protection">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-700 text-white [&_svg]:size-6">
              <ShieldCheckIcon />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-brand-800 dark:text-brand-300">Account protection</p>
              <p className="text-xl font-bold tracking-tight">{level}</p>
            </div>
            <p className="ml-auto text-right text-xs text-neutral-600 dark:text-neutral-400">
              {doneCount} of 4
              <br />
              protections on
            </p>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5" aria-hidden>
            {checks.map((check, index) => (
              <span key={index} className={cn("h-1.5 rounded-full", check.done ? "bg-brand-600" : "bg-brand-200 dark:bg-white/15")} />
            ))}
          </div>
        </section>

        {/* Protections */}
        <section className="mt-7" aria-labelledby="sec-protections">
          <h2 id="sec-protections" className={LABEL}>
            Protections
          </h2>
          <ul className={cn(CARD, "mt-3")}>
            <li className={ROW}>
              <span className={ICON}>
                <KeyIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem]">App PIN</span>
                <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                  On · needed every time the app opens
                </span>
              </span>
              <Link href={ROUTES.forgotPin} className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-white/10">
                Change
              </Link>
            </li>
            <BiometricUnlockRow isOn={account.hasBiometrics} />
            <li className={ROW}>
              <span className={ICON}>
                <ShieldCheckIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem]">Two-step log-in</span>
                <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                  {account.twoFactorMethod
                    ? `On · ${TWO_FACTOR_NAMES[account.twoFactorMethod]}`
                    : "Off · ask for a code when you log in on a new device"}
                </span>
              </span>
              <StatusDot on={account.twoFactorMethod !== null} />
            </li>
            <li className={ROW}>
              <span className={ICON}>
                <PhoneIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem]">Phone number</span>
                <span className="mt-0.5 block text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                  {account.phone ? `${maskGhanaPhone(account.phone)} · for payments and codes` : "Not added yet"}
                </span>
              </span>
              <StatusDot on={account.phone !== null} />
            </li>
          </ul>
        </section>

        {/* Devices */}
        <section className="mt-7" aria-labelledby="sec-devices">
          <h2 id="sec-devices" className={LABEL}>
            Signed-in devices
          </h2>
          <ul className={cn(CARD, "mt-3")}>
            {activity.devices.map((device) => {
              const isThis = device.id === deviceId;
              return (
                <li key={device.id} className={ROW}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300" aria-hidden>
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
                      <path d="M11 18.5h2" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem]">{device.name}</span>
                    <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                      {isThis ? "Active now" : `Last active ${when(device.lastSeen).replace(/^(Today|Yesterday)/, (word) => word.toLowerCase())}`} · since{" "}
                      {new Date(device.firstSeen).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </span>
                  {isThis && (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[0.6875rem] font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-300">
                      This device
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            disabled={others.length === 0}
            onClick={() => setIsConfirming(true)}
            className="mt-3 h-11 w-full cursor-pointer rounded-full border border-red-200 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 dark:disabled:border-white/10 dark:disabled:text-neutral-500"
          >
            {others.length === 0 ? "No other devices signed in" : `Sign out of ${others.length} other device${others.length === 1 ? "" : "s"}`}
          </button>
        </section>

        {/* Activity */}
        <section className="mt-7" aria-labelledby="sec-activity">
          <h2 id="sec-activity" className={LABEL}>
            Recent activity
          </h2>
          {activity.events.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Log-ins and security changes will show here.
            </p>
          ) : (
            <ol className="mt-3 flex flex-col">
              {activity.events.slice(0, 10).map((event, index, list) => (
                <li key={event.id} className={cn("relative flex gap-3.5", index < list.length - 1 && "pb-5")}>
                  {index < list.length - 1 && (
                    <span aria-hidden className="absolute top-3.5 bottom-0 left-[0.3125rem] w-px bg-neutral-200 dark:bg-white/15" />
                  )}
                  <span aria-hidden className="relative mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-600 ring-4 ring-brand-50 dark:ring-brand-500/15" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{SECURITY_EVENT_TITLES[event.kind]}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{event.device}</span>
                      {event.deviceId === deviceId ? " (this device)" : ""} · {when(event.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Scam warning */}
        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <p className="text-[0.9375rem] font-bold text-amber-950 dark:text-amber-100">We will never ask for your PIN</p>
          <p className="mt-1.5 text-sm leading-6 text-amber-950/80 dark:text-amber-100/80">
            Feenicks1 will never ask for your PIN, password or verification codes — not by phone, SMS, WhatsApp or email.
            Anyone who asks is trying to steal from you.
          </p>
          <p className="mt-3 text-sm leading-6 text-amber-950/80 dark:text-amber-100/80">
            See something you don&apos;t recognise?{" "}
            <Link href={ROUTES.support} className="font-semibold text-amber-950 underline underline-offset-2 dark:text-amber-100">
              Contact us straight away
            </Link>
            .
          </p>
        </section>
      </div>

      <ConfirmDialog
        open={isConfirming}
        tone="danger"
        title="Sign out of other devices?"
        message="Every other phone or computer signed in to your account will be signed out. This device stays signed in."
        confirmLabel="Sign out others"
        onConfirm={confirmSignOut}
        onCancel={() => setIsConfirming(false)}
      />
    </StepScreenLayout>
  );
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold",
        on
          ? "bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300"
          : "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-400",
      )}
    >
      {on ? "On" : "Off"}
    </span>
  );
}
