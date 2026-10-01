"use client";

/**
 * IdCardFrame: the ID-card-shaped area on the upload screen. Purely visual:
 * the screen decides the stage, this draws it.
 *
 *   "empty"     dashed frame: tap to take a photo / choose a file, or drop one (desktop)
 *   "scanning"  the photo, green corner guides and a light beam sweeping over it
 *   "verified"  the photo, softened, with a green tick that pops in
 *
 * Shaped like a real ID card (85.6 × 54 mm, ratio ≈ 1.586) so users
 * instinctively fill the frame with their card.
 */

import { useState } from "react";
import { CheckIcon, IdCardIcon, PassportIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type FrameStage = "empty" | "scanning" | "verified";

type IdCardFrameProps = {
  stage: FrameStage;
  /** Object URL of the chosen photo (shown while scanning / verified). */
  previewUrl: string | null;
  /** e.g. "front of your card". */
  sideLabel: string;
  /** Text under the tick when verified, e.g. "Front verified". */
  verifiedText: string;
  isPassport: boolean;
  /** Called with the file the user picked or dropped. */
  onFileSelected: (file: File) => void;
  /** Flip animation classes from the screen (card turning out / in). */
  className?: string;
};

/** Image types we accept (HEIC = iPhone photos). */
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function IdCardFrame({
  stage,
  previewUrl,
  sideLabel,
  verifiedText,
  isPassport,
  onFileSelected,
  className,
}: IdCardFrameProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  /* ── Empty: tap / click / drop to add a photo ───────────────────────── */
  if (stage === "empty" || !previewUrl) {
    return (
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          const file = e.dataTransfer.files[0];
          if (file) onFileSelected(file);
        }}
        className={cn(
          "flex aspect-[1.586] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 text-center transition-colors focus-within:border-brand-600",
          isDraggingOver
            ? "border-brand-600 bg-brand-50"
            : "border-brand-300 bg-brand-50/50 hover:border-brand-500 dark:bg-brand-500/5",
          className,
        )}
      >
        {/* No `capture` attribute on purpose: phones then offer BOTH the
            camera and the photo library. */}
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = ""; // allow picking the same file again after an error
          }}
        />
        <span className="grid size-14 place-items-center rounded-full bg-white text-brand-600 dark:bg-brand-500/10 [&_svg]:size-7">
          {isPassport ? <PassportIcon /> : <IdCardIcon />}
        </span>
        <span className="text-base font-bold lg:text-[0.9375rem]">Upload {sideLabel}</span>
        <span className="text-[0.8125rem] text-neutral-500">
          Tap to take a photo or choose a file
          <span className="hidden lg:inline">, or drag it here</span>
        </span>
      </label>
    );
  }

  /* ── Scanning / verified: show the photo ───────────────────────────── */
  return (
    <div
      className={cn(
        "relative aspect-[1.586] w-full overflow-hidden rounded-2xl bg-neutral-900",
        className,
      )}
    >
      {/* A blob/object URL of the user's own photo, so next/image isn't needed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={`Your photo of the ${sideLabel}`}
        className={cn(
          "size-full object-cover transition-opacity duration-500",
          stage === "verified" && "opacity-40",
        )}
      />

      {stage === "scanning" && (
        <div aria-hidden className="absolute inset-0">
          {/* Light green tint while scanning. */}
          <div className="absolute inset-0 bg-brand-500/10" />

          {/* Corner guides, like a camera viewfinder. */}
          <span className="absolute top-3 left-3 size-7 rounded-tl-lg border-t-[3px] border-l-[3px] border-brand-400" />
          <span className="absolute top-3 right-3 size-7 rounded-tr-lg border-t-[3px] border-r-[3px] border-brand-400" />
          <span className="absolute bottom-3 left-3 size-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-brand-400" />
          <span className="absolute right-3 bottom-3 size-7 rounded-br-lg border-r-[3px] border-b-[3px] border-brand-400" />

          {/* The scanning light: a bright line with a soft green trail. */}
          <div className="absolute inset-x-0 h-0 animate-scan-beam motion-reduce:animate-none">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-brand-400/45 to-transparent" />
            <div className="absolute inset-x-0 -top-px h-[3px] bg-brand-300 shadow-[0_0_14px_4px_rgba(74,212,135,0.85)]" />
          </div>
        </div>
      )}

      {stage === "verified" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-black/30">
          <span className="grid size-16 animate-pop-in place-items-center rounded-full bg-brand-600 text-white motion-reduce:animate-none">
            <CheckIcon className="size-8 stroke-3" />
          </span>
          <span className="animate-pop-in rounded-full bg-white px-3 py-1 text-sm font-bold text-brand-700 [animation-delay:120ms] motion-reduce:animate-none">
            {verifiedText}
          </span>
        </div>
      )}
    </div>
  );
}
