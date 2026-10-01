"use client";

/**
 * useCamera: live camera preview + snapshot, for selfies and scanning.
 *
 *   const camera = useCamera({ facing: "user" });
 *   <video ref={camera.videoRef} playsInline muted />
 *   await camera.start();             // asks permission the first time
 *   const photo = await camera.capture(); // JPEG Blob of the current frame
 *   camera.stop();                    // camera light goes off
 *
 * `status` tells the screen what to show:
 *   idle → starting → ready
 *                   ↘ denied       (the user or browser blocked the camera)
 *                   ↘ unavailable  (no camera, or the browser can't use one)
 *                   ↘ error        (anything else)
 *
 * Privacy: the camera is always switched off on unmount, and starting it
 * again replaces any previous stream, so the camera light never stays on
 * by accident. Requires HTTPS (or localhost) and our Permissions-Policy
 * header allowing `camera=(self)`, see next.config.ts.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "starting" | "ready" | "denied" | "unavailable" | "error";

type UseCameraOptions = {
  /** "user" = front (selfie) camera, "environment" = back camera. */
  facing?: "user" | "environment";
};

export function useCamera({ facing = "user" }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMounted = useRef(true);
  const [status, setStatus] = useState<CameraStatus>("idle");

  /** Turns the camera off (the camera light goes out). */
  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /** Turns the camera on and shows it in `videoRef`. Asks permission the first time. */
  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }

    setStatus("starting");
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });

      // The screen closed while the user was answering the permission prompt.
      if (!isMounted.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {
          // Autoplay can be refused in rare cases; the stream still shows on the next frame.
        });
      }
      setStatus("ready");
    } catch (error) {
      if (!isMounted.current) return;
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") setStatus("denied");
      else if (name === "NotFoundError" || name === "OverconstrainedError") setStatus("unavailable");
      else setStatus("error");
    }
  }, [facing, stop]);

  /** Snapshot of the current camera frame as a JPEG (null if the camera isn't ready). */
  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Drawn un-mirrored: the real image, as verification services expect.
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  }, []);

  // Always switch the camera off when the screen closes.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stop();
    };
  }, [stop]);

  return { videoRef, status, start, stop, capture };
}
