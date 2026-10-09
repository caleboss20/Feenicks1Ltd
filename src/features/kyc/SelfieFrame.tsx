"use client";

/**
 * SelfieFrame: the camera area on "Selfie with ID Card". Purely visual:
 * the screen decides what's happening, this draws it.
 *
 *   ┌───────────────────────────┐
 *   │    ( Matching… 47% )      │  ← progress pill while scanning / "Face matched ✓"
 *   │      ╭─ ─ ─ ─ ─╮          │
 *   │      ╎  face   ╎          │  ← oval guide; outside of it is darkened.
 *   │      ╰─ ─ ─ ─ ─╯          │     Scanning: solid green + light beam.
 *   │ ┌──────────┐              │     Matched: green + tick.
 *   │ │Ghana Card│              │  ← preview of the ID photo they uploaded
 *   │ └──────────┘              │
 *   └───────────────────────────┘
 *
 * Shows either the LIVE camera (`videoRef`) or the captured selfie. The live
 * camera is mirrored, like every selfie camera, so moving left moves left on
 * screen; a snapshot from it stays mirrored to match. Uploaded photos are not.
 */

import { CheckIcon } from "@/components/icons";
import type { CameraStatus } from "@/hooks/useCamera";
import { cn } from "@/lib/utils";

export type MatchStage = "idle" | "scanning" | "matched" | "failed";

type SelfieFrameProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraStatus: CameraStatus;
  /** The captured selfie; when set, it's shown instead of the live camera. */
  selfieUrl: string | null;
  /**
   * Mirror the selfie on screen? Yes for photos taken with the live camera
   * (so the snapshot matches the mirrored preview), no for uploaded photos
   * (they're already the right way round; mirroring would flip any text).
   */
  mirrorSelfie: boolean;
  /** The verified ID photo, shown in the corner for comparison. */
  cardUrl: string;
  /** e.g. "Ghana Card". */
  cardLabel: string;
  stage: MatchStage;
  /** 0–100, shown while scanning. */
  percent: number;
  onRetryCamera: () => void;
  onUploadSelfie: (file: File) => void;
};

export function SelfieFrame({
  videoRef,
  cameraStatus,
  selfieUrl,
  mirrorSelfie,
  cardUrl,
  cardLabel,
  stage,
  percent,
  onRetryCamera,
  onUploadSelfie,
}: SelfieFrameProps) {
  const showLive = !selfieUrl;
  const cameraProblem =
    showLive && (cameraStatus === "denied" || cameraStatus === "unavailable" || cameraStatus === "error");
  const isScanning = stage === "scanning";
  const isMatched = stage === "matched";

  return (
    <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-3xl bg-neutral-900 lg:h-[min(54vh,28rem)] lg:w-auto">
      {/* ── Live camera (always mounted so the camera hook can attach to it) ── */}
      <video
        ref={videoRef}
        playsInline // required on iPhone, or the video opens fullscreen
        muted
        aria-label="Live camera preview"
        className={cn(
          "absolute inset-0 size-full -scale-x-100 object-cover",
          (!showLive || cameraStatus !== "ready") && "invisible",
        )}
      />

      {/* ── Captured selfie (an in-memory blob: URL, so a plain <img>) ── */}
      {selfieUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={selfieUrl}
          alt="Your selfie"
          className={cn("absolute inset-0 size-full object-cover", mirrorSelfie && "-scale-x-100")}
        />
      )}

      {/* ── Camera starting / problem messages ── */}
      {showLive && cameraStatus === "starting" && (
        <p className="absolute inset-0 grid place-items-center text-sm text-white/80">
          Starting camera…
        </p>
      )}
      {cameraProblem && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center text-white">
          <p className="text-[0.9375rem] font-semibold">
            {cameraStatus === "denied"
              ? "Camera access is blocked"
              : cameraStatus === "unavailable"
                ? "No camera found"
                : "We couldn't start your camera"}
          </p>
          <p className="text-[0.8125rem] text-white/70">
            {cameraStatus === "denied"
              ? "Allow camera access for this site in your browser settings, or upload a selfie instead."
              : "You can upload a selfie instead."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {cameraStatus !== "unavailable" && (
              <button
                type="button"
                onClick={onRetryCamera}
                className="cursor-pointer rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
              >
                Try again
              </button>
            )}
            {/* capture="user" opens the front camera app on phones. */}
            <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              Upload a selfie
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadSelfie(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      )}

      {/* ── Oval face guide (hidden while there's a camera problem) ── */}
      {!cameraProblem && (
        <div
          aria-hidden
          className={cn(
            // The huge spread "shadow" darkens everything OUTSIDE the oval.
            "absolute top-[9%] left-1/2 aspect-[3/4] w-[62%] -translate-x-1/2 overflow-hidden rounded-[50%] border-[3px] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-colors duration-300",
            isScanning || isMatched ? "border-solid border-brand-400" : "border-dashed border-white/85",
          )}
        >
          {/* Scanning light sweeping over the face. */}
          {isScanning && (
            <div className="absolute inset-x-0 h-0 animate-scan-beam motion-reduce:animate-none">
              <div className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-brand-400/45 to-transparent" />
              <div className="absolute inset-x-0 -top-px h-[3px] bg-brand-300 shadow-[0_0_14px_4px_rgba(74,212,135,0.85)]" />
            </div>
          )}
        </div>
      )}

      {/* ── Tick when the face matches ── */}
      {isMatched && (
        <span className="absolute top-[47%] left-1/2 grid size-14 -translate-x-1/2 animate-pop-in place-items-center rounded-full bg-brand-700 text-white motion-reduce:animate-none">
          <CheckIcon className="size-7 stroke-3" />
        </span>
      )}

      {/* ── Status pill at the top ── */}
      {(isScanning || isMatched) && (
        <span
          className={cn(
            "absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[0.8125rem] font-semibold whitespace-nowrap tabular-nums",
            isMatched ? "bg-brand-700 text-white" : "bg-black/60 text-white",
          )}
        >
          {isMatched ? "Face matched" : `Matching your face… ${Math.round(percent)}%`}
        </span>
      )}

      {/* ── The uploaded ID, bottom-left, for comparison ── */}
      {!cameraProblem && (
        <div
          className={cn(
            "absolute bottom-3 left-3 w-[42%] overflow-hidden rounded-xl ring-2 transition-colors duration-300",
            isScanning || isMatched ? "ring-brand-400" : "ring-white",
          )}
        >
          <div className="relative aspect-[1.586] bg-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardUrl} alt={`Your ${cardLabel}`} className="size-full object-cover" />
            {isScanning && (
              <div aria-hidden className="absolute inset-x-0 h-0 animate-scan-beam motion-reduce:animate-none">
                <div className="absolute inset-x-0 -top-px h-0.5 bg-brand-300 shadow-[0_0_10px_3px_rgba(74,212,135,0.85)]" />
              </div>
            )}
          </div>
          <span className="block bg-white px-2 py-1 text-[0.6875rem] font-bold text-neutral-800">
            {cardLabel}
          </span>
        </div>
      )}
    </div>
  );
}
