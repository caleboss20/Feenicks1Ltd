"use client";

/**
 * Home's "Add Feenicks1 to your home screen" card.
 *
 *   ┌──────────────────────────────────────────┐
 *   │ [F1]  Get the Feenicks1 app          ✕   │  ← app icon · title · close
 *   │       Open it in one tap, full screen.    │
 *   │       ( Install )                         │  ← Android: the browser's dialog
 *   │       or: Tap Share ⎙, then               │  ← iPhone: the two steps
 *   │           "Add to Home Screen".           │
 *   └──────────────────────────────────────────┘
 *
 * Shows only when installing is possible and the app isn't installed;
 * ✕ hides it for 30 days (installPrompt.ts).
 */

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { CloseIcon } from "@/components/icons";
import {
  dismissInstall,
  getInstallSnapshot,
  getServerInstallSnapshot,
  promptInstall,
  subscribeInstall,
} from "./installPrompt";

/** The iOS "Share" glyph: a square with an arrow up. */
function IosShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="inline size-4 -translate-y-px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

export function InstallAppCard({ className }: { className?: string }) {
  const { mode, dismissed } = useSyncExternalStore(subscribeInstall, getInstallSnapshot, getServerInstallSnapshot);
  if (mode === "none" || dismissed) return null;

  return (
    <section aria-label="Get the Feenicks1 app" className={className}>
      <div className="relative flex gap-4 rounded-3xl bg-white p-4 pr-12 dark:bg-white/5">
        <Image src="/icon.png" alt="" width={48} height={48} className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] font-semibold">Get the Feenicks1 app</h2>
          <p className="mt-0.5 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Open it in one tap, full screen, from your home screen.
          </p>
          {mode === "prompt" ? (
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 dark:bg-white dark:text-brand-900"
            >
              Install
            </button>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              Tap Share <IosShareIcon /> in Safari, then <span className="font-semibold">Add to Home Screen</span>.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismissInstall}
          aria-label="Not now"
          className="absolute top-3 right-3 grid size-8 cursor-pointer place-items-center rounded-full text-neutral-500 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    </section>
  );
}
