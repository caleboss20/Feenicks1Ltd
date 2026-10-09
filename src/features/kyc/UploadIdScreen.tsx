"use client";

/**
 * KYC step 4: "Upload Your Ghana Card" (or passport). Everything happens on
 * ONE screen, side by side, with no page changes:
 *
 *   [Front] · [Back]                ← step chips (✓ when done)
 *
 *   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
 *     Upload front of your card     ① empty frame: tap / choose / drop a photo
 *   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
 *           ↓
 *   ② scanning: green light beam sweeps the photo (6 s in demo mode)
 *   ③ verified: green tick pops in ("Front verified")
 *   ④ the card turns on its vertical axis and vanishes…
 *   ⑤ …and an empty frame turns in: "Upload back of your card" → ②–③ again
 *   ⑥ all sides done → "Continue" is enabled
 *
 * Cards (Ghana Card, Driver's Licence, Non-Citizen Ghana Card) have a front and back;
 * a passport only needs its photo page.
 *
 * Privacy: until the backend exists, photos never leave the device. They're
 * kept in memory only: rejected photos are freed straight away, verified
 * ones are handed to the KYC store (which frees them when KYC is reset).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { StepScreenLayout, stepActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { ROUTES } from "@/config/routes";
import { wait } from "@/config/demoMode";
import { cn } from "@/lib/utils";
import { IdCardFrame, type FrameStage } from "./IdCardFrame";
import { IDENTITY_DOCUMENTS, getDocumentSides } from "./identityDocuments";
import { verifyIdDocumentSide } from "./kycService";
import { useKycStore } from "./useKycStore";

/** Largest photo we accept (phone camera photos are usually 2–6 MB). */
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
/** How long the green tick shows before the card flips away. */
const SHOW_SUCCESS_MS = 1400;
/** Must match the card-flip animations in globals.css (0.55s). */
const FLIP_MS = 550;

/** Where "Continue" leads: the selfie, matched against this ID. */
const NEXT_SCREEN = ROUTES.kycSelfie;

/**
 * Where we are in the sequence for the current side:
 *   empty → scanning → verified → flipping-out → (next side) flipping-in → empty …
 *   …and "complete" once the last side is verified.
 */
type Phase = "empty" | "scanning" | "verified" | "flipping-out" | "flipping-in" | "complete";

export function UploadIdScreen() {
  const router = useRouter();
  const document = useKycStore((s) => s.identityDocument);
  const saveIdPhoto = useKycStore((s) => s.saveIdPhoto);

  const [sideIndex, setSideIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("empty");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);

  // Stops the timed sequence if the user leaves the screen part-way through.
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // No document chosen = step 3 was skipped or the page refreshed → go back to it.
  useEffect(() => {
    if (!document) router.replace(ROUTES.kycProofOfResidency);
  }, [document, router]);

  if (!document) return null;

  const documentInfo = IDENTITY_DOCUMENTS[document];
  const sides = getDocumentSides(document);
  const side = sides[sideIndex];
  const isLastSide = sideIndex === sides.length - 1;
  const isComplete = phase === "complete";

  const handleFile = async (file: File) => {
    setError(null);

    // Basic checks before scanning (the server re-checks everything).
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo (JPG, PNG, WebP or HEIC).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("That photo is larger than 10 MB. Please choose a smaller one.");
      return;
    }

    // ② Scanning
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPhase("scanning");
    const result = await verifyIdDocumentSide(document, side.id, file);
    if (!isMounted.current) {
      URL.revokeObjectURL(url); // left mid-scan: free the photo
      return;
    }

    if (!result.ok) {
      URL.revokeObjectURL(url); // rejected photo: free it
      setError(result.message);
      setPreviewUrl(null);
      setPhase("empty");
      return;
    }

    // ③ Verified: hand the photo to the KYC store (it now owns and frees it;
    // the selfie step shows it next to the user's face), then let the tick sink in.
    saveIdPhoto(side.id, { file, url });
    setPhase("verified");
    await wait(SHOW_SUCCESS_MS);
    if (!isMounted.current) return;

    if (isLastSide) {
      setPhase("complete");
      return;
    }

    // ④ Card turns away…
    setPhase("flipping-out");
    await wait(FLIP_MS);
    if (!isMounted.current) return;

    // ⑤ …and the next side's empty frame turns in
    setPreviewUrl(null);
    setSideIndex((i) => i + 1);
    setPhase("flipping-in");
    await wait(FLIP_MS);
    if (!isMounted.current) return;
    setPhase("empty");
  };

  // What the frame should draw for the current phase.
  const frameStage: FrameStage =
    phase === "scanning" ? "scanning" : phase === "verified" || isComplete || phase === "flipping-out" ? "verified" : "empty";

  // Status line under the frame (read out by screen readers as it changes).
  const statusText = isComplete
    ? `${documentInfo.label} verified. You can continue.`
    : phase === "scanning"
      ? `Scanning the ${side.label}…`
      : phase === "verified" || phase === "flipping-out"
        ? `${side.shortLabel} verified`
        : "Make sure all four corners are visible and the details are clear, with no glare.";

  return (
    <StepScreenLayout
      title={`Upload Your ${documentInfo.label}`}
      subtitle="Take a clear photo or choose one from your files."
      backHref={ROUTES.kycProofOfResidency}
    >
      <div className="flex flex-1 flex-col sm:flex-none">
        {/* ── Step chips: Front ✓ · Back ─────────────────────────────── */}
        {sides.length > 1 && (
          <ol className="flex gap-2" aria-label="Sides to upload">
            {sides.map((s, i) => {
              const isDone = i < sideIndex || isComplete;
              const isCurrent = i === sideIndex && !isComplete;
              return (
                <li
                  key={s.id}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors",
                    isDone && "bg-brand-700 text-white",
                    isCurrent && "bg-brand-50 text-brand-700 ring-1 ring-brand-600 ring-inset dark:bg-brand-500/10",
                    !isDone && !isCurrent && "bg-neutral-100 text-neutral-500 dark:bg-white/5",
                  )}
                >
                  {isDone && <CheckIcon className="size-3.5 stroke-3" />}
                  {s.shortLabel}
                </li>
              );
            })}
          </ol>
        )}

        {/* ── The card frame (vertically centred on phones) ─────────────── */}
        <div className="my-auto flex flex-col gap-4 py-8 sm:my-0 lg:py-6">
          <IdCardFrame
            // A new key per side restarts the frame cleanly for each side.
            key={side.id}
            stage={frameStage}
            previewUrl={previewUrl}
            sideLabel={side.label}
            verifiedText={isComplete ? `${documentInfo.label} verified` : `${side.shortLabel} verified`}
            isPassport={document === "passport"}
            onFileSelected={handleFile}
            className={cn(
              phase === "flipping-out" && "animate-card-flip-out",
              phase === "flipping-in" && "animate-card-flip-in",
            )}
          />

          <p
            aria-live="polite"
            className={cn(
              "text-center text-[0.8125rem] leading-relaxed",
              phase === "scanning" || phase === "verified" || isComplete
                ? "font-semibold text-brand-700 dark:text-brand-400"
                : "text-neutral-500",
            )}
          >
            {statusText}
          </p>

          <FormErrorMessage message={error} />
        </div>

        <div className={stepActionsClass}>
          <Button
            size="lg"
            fullWidth
            disabled={!isComplete}
            isLoading={isContinuing}
            loadingLabel="Continuing"
            onClick={() => {
              setIsContinuing(true);
              router.push(NEXT_SCREEN);
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </StepScreenLayout>
  );
}
