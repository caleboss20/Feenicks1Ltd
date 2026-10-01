"use client";

/**
 * KYC step 5: "Selfie with ID Card": a live selfie, matched against the
 * photo on the ID uploaded in the previous step.
 *
 *   ① Camera on: live front camera, oval face guide, the uploaded ID in the
 *      corner. Button: [ 📷 Take Selfie ]
 *   ② Matching: the photo freezes, a green light scans the face AND the card,
 *      "Matching your face… 47%" counts up (6 s in demo mode).
 *      Buttons: [ Retake ] [ Submit ], both disabled while matching.
 *   ③ Matched: "Face matched" + tick. Buttons enabled:
 *        Retake → back to ① (take a new selfie)
 *        Submit → send it and continue to the next step
 *      Not matched: an error message; only Retake is enabled.
 *
 * No camera (blocked / missing / failing)? "Upload a selfie" appears as a
 * fallback, by product decision: the backend verifies every selfie against
 * the ID, and is told which selfies were uploaded so it can check them
 * more strictly (see verifySelfieMatch).
 *
 * Privacy: the camera turns off as soon as the selfie is taken (and when the
 * screen closes). Photos stay in memory on the device until the backend exists.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, RetakeIcon } from "@/components/icons";
import { StepScreenLayout, stepActionsClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { ROUTES } from "@/config/routes";
import { useCamera } from "@/hooks/useCamera";
import { cn } from "@/lib/utils";
import { IDENTITY_DOCUMENTS } from "./identityDocuments";
import { verifySelfieMatch } from "./kycService";
import { SelfieFrame, type MatchStage } from "./SelfieFrame";
import { useKycStore } from "./useKycStore";

/** Where "Submit" leads: filling in the profile. */
const NEXT_SCREEN = ROUTES.kycProfile;

/** Largest selfie we accept when uploaded instead of taken live. */
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function SelfieWithIdScreen() {
  const router = useRouter();
  const document = useKycStore((s) => s.identityDocument);
  const idPhotos = useKycStore((s) => s.idPhotos);
  const saveSelfie = useKycStore((s) => s.saveSelfie);

  // The ID photo to compare against: card front, or the passport photo page.
  const cardPhoto = idPhotos.front ?? idPhotos["photo-page"];

  const camera = useCamera({ facing: "user" });
  const startCamera = camera.start;

  const [selfie, setSelfie] = useState<{ file: Blob; url: string; fromCamera: boolean } | null>(
    null,
  );
  const [stage, setStage] = useState<MatchStage>("idle");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Missing earlier steps (e.g. after a page refresh) → go back to them.
  useEffect(() => {
    if (!document) router.replace(ROUTES.kycProofOfResidency);
    else if (!cardPhoto) router.replace(ROUTES.kycUploadId);
  }, [document, cardPhoto, router]);

  // Turn the camera on when the screen opens.
  useEffect(() => {
    if (document && cardPhoto) void startCamera();
  }, [document, cardPhoto, startCamera]);

  // While matching, count the percentage up smoothly towards 95%
  // (it jumps to 100% when the result arrives).
  useEffect(() => {
    if (stage !== "scanning") return;
    const timer = setInterval(() => {
      setPercent((p) => Math.min(95, p + Math.max(0.4, (95 - p) * 0.05)));
    }, 100);
    return () => clearInterval(timer);
  }, [stage]);

  if (!document || !cardPhoto) return null;

  const documentLabel = IDENTITY_DOCUMENTS[document].label;

  /** Runs the face match on a selfie (taken with the live camera, or uploaded). */
  const matchSelfie = async (file: Blob, fromCamera: boolean) => {
    camera.stop(); // camera light off as soon as we have the photo
    const url = URL.createObjectURL(file);
    setSelfie({ file, url, fromCamera });
    setError(null);
    setPercent(0);
    setStage("scanning");

    const result = await verifySelfieMatch(file, cardPhoto.file, fromCamera ? "camera" : "upload");
    if (!isMounted.current) {
      URL.revokeObjectURL(url);
      return;
    }
    if (!result.ok) {
      setStage("failed");
      setError(result.message);
      return;
    }
    setPercent(100);
    setStage("matched");
  };

  const handleTakeSelfie = async () => {
    const photo = await camera.capture();
    if (!photo) {
      setError("We couldn't take the photo. Please try again.");
      return;
    }
    await matchSelfie(photo, true);
  };

  const handleUploadSelfie = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo (JPG, PNG, WebP or HEIC).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("That photo is larger than 10 MB. Please choose a smaller one.");
      return;
    }
    void matchSelfie(file, false);
  };

  const handleRetake = () => {
    if (selfie) URL.revokeObjectURL(selfie.url);
    setSelfie(null);
    setStage("idle");
    setPercent(0);
    setError(null);
    void startCamera();
  };

  const handleSubmit = () => {
    if (!selfie || stage !== "matched") return;
    setIsSubmitting(true);
    // The KYC store now owns (and later frees) the selfie.
    saveSelfie({ file: selfie.file, url: selfie.url });
    router.push(NEXT_SCREEN);
  };

  // Instruction / status line under the frame (read out by screen readers).
  const statusText =
    stage === "scanning"
      ? `Comparing your face with your ${documentLabel}…`
      : stage === "matched"
        ? `Your face matches your ${documentLabel}. Submit to continue.`
        : "Position your face inside the oval, in good light, and hold still.";

  return (
    <StepScreenLayout
      title="Selfie with ID Card"
      subtitle="Look at the camera and hold still."
      backHref={ROUTES.kycUploadId}
    >
      <div className="flex flex-1 flex-col sm:flex-none">
        <div className="my-auto flex flex-col gap-4 py-5 sm:my-0 lg:py-4">
          <SelfieFrame
            videoRef={camera.videoRef}
            cameraStatus={camera.status}
            selfieUrl={selfie?.url ?? null}
            mirrorSelfie={selfie?.fromCamera ?? true}
            cardUrl={cardPhoto.url}
            cardLabel={documentLabel}
            stage={stage}
            percent={percent}
            onRetryCamera={() => void startCamera()}
            onUploadSelfie={handleUploadSelfie}
          />

          <p
            aria-live="polite"
            className={cn(
              "text-center text-[0.8125rem] leading-relaxed",
              stage === "scanning" || stage === "matched"
                ? "font-semibold text-brand-700 dark:text-brand-400"
                : "text-neutral-500",
            )}
          >
            {statusText}
          </p>

          <FormErrorMessage message={error} />
        </div>

        <div className={stepActionsClass}>
          {selfie ? (
            // After the selfie: Retake + Submit, as in the design.
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="soft"
                size="lg"
                onClick={handleRetake}
                disabled={stage === "scanning" || isSubmitting}
              >
                <RetakeIcon className="size-4.5" />
                Retake
              </Button>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={stage !== "matched"}
                isLoading={isSubmitting}
                loadingLabel="Submitting"
              >
                Submit
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              fullWidth
              onClick={handleTakeSelfie}
              disabled={camera.status !== "ready"}
            >
              <CameraIcon />
              Take Selfie
            </Button>
          )}
        </div>
      </div>
    </StepScreenLayout>
  );
}
