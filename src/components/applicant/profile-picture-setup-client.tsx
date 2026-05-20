"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, ImagePlus, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { actionButtonStyles } from "@/components/ui/action-button";
import {
  PROFILE_IMAGE_FILE_INPUT_ACCEPT,
  validateProfileImageFile,
} from "@/lib/profile-image-upload-rules";

const SETUP_ROUTE = "/applicant/profile-picture/setup";

function canUseAsNextPath(value: string | null): value is string {
  return Boolean(value && value.startsWith("/applicant/") && !value.startsWith(SETUP_ROUTE));
}

function buildCaptureFile(blob: Blob): File {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return new File([blob], `profile-picture-${timestamp}.jpg`, { type: "image/jpeg" });
}

export function ProfilePictureSetupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const nextPath = useMemo(() => {
    const value = searchParams.get("next");
    return canUseAsNextPath(value) ? value : "/applicant/dashboard";
  }, [searchParams]);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function assignFile(nextFile: File | null) {
    if (!nextFile) {
      setFile(null);
      setError(null);
      setMessage(null);
      return;
    }

    const validationError = validateProfileImageFile(nextFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setMessage(null);
      return;
    }

    setFile(nextFile);
    setError(null);
    setMessage("Profile image is ready to upload.");
  }

  async function startCamera() {
    setCameraLoading(true);
    setError(null);
    setMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setError("Camera access was denied or unavailable. Use file upload instead.");
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  async function captureFromCamera() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Camera is still initializing. Try again in a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setError("Unable to capture from camera. Please use file upload.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.9);
    });

    if (!blob) {
      setError("Unable to capture image. Please try again.");
      return;
    }

    assignFile(buildCaptureFile(blob));
    stopCamera();
  }

  async function uploadProfileImage() {
    if (!file || submitting) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = new FormData();
      payload.append("image", file);

      const response = await fetch("/api/applicant/profile-picture", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to upload profile image.");
      }

      setMessage("Profile picture saved. Redirecting...");
      router.replace(nextPath);
      router.refresh();
    } catch (uploadError) {
      const uploadMessage =
        uploadError instanceof Error ? uploadError.message : "Unable to upload profile image.";
      setError(uploadMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Applicant"
        title="Complete Profile Picture"
        description="A profile picture is required before continuing to the applicant portal."
      />

      <SectionCard title="Capture or Upload" description="Use your camera or upload a clear photo of yourself.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {!cameraActive ? (
              <button
                type="button"
                disabled={cameraLoading || submitting}
                onClick={startCamera}
                className={actionButtonStyles("secondary", "sm")}
              >
                {cameraLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Camera className="mr-1.5 h-4 w-4" />}
                Open Camera
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={captureFromCamera}
                  className={actionButtonStyles("primary", "sm")}
                >
                  <Camera className="mr-1.5 h-4 w-4" />
                  Capture
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={stopCamera}
                  className={actionButtonStyles("secondary", "sm")}
                >
                  <CameraOff className="mr-1.5 h-4 w-4" />
                  Close Camera
                </button>
              </>
            )}

            <label className={actionButtonStyles("secondary", "sm")}>
              <ImagePlus className="mr-1.5 h-4 w-4" />
              Choose Image
              <input
                type="file"
                accept={PROFILE_IMAGE_FILE_INPUT_ACCEPT}
                className="sr-only"
                disabled={submitting}
                onChange={(event) => {
                  assignFile(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          {cameraActive ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
              <video
                ref={videoRef}
                className="h-auto w-full max-h-[360px] object-contain"
                autoPlay
                playsInline
                muted
              />
            </div>
          ) : null}

          {previewUrl ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Preview</p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img src={previewUrl} alt="Profile preview" className="h-auto w-full max-h-[360px] object-contain" />
              </div>
              <p className="text-xs text-slate-600">Selected file: {file?.name}</p>
            </div>
          ) : null}

          {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
          {message ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </p>
          ) : null}

          <div className="pt-2">
            <button
              type="button"
              disabled={!file || submitting}
              onClick={uploadProfileImage}
              className={actionButtonStyles("primary", "md")}
            >
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Save Profile Picture
            </button>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
