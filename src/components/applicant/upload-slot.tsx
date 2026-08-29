"use client";

import { DocumentDownloadButton } from "@/components/ui/document-download-button";

interface UploadSlotProps {
  label: string;
  required?: boolean;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
  fileName?: string;
  uploadedAt?: Date | string;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  accept?: string;
  previewUrl?: string;
}

function formatUploadTimestamp(date: Date | string): string {
  try {
    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Manila",
    }).format(new Date(date));
  } catch {
    return "Upload time unavailable";
  }
}

export function UploadSlot({
  label,
  required = false,
  onFileChange,
  onRemove,
  fileName,
  uploadedAt,
  disabled = false,
  helperText,
  error,
  accept,
  previewUrl,
}: UploadSlotProps) {
  const inputId = `upload-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div
      className={`block rounded-2xl border border-dashed p-4 transition-colors ${
        error && !fileName
          ? "border-[var(--danger)] bg-[var(--danger-soft)]"
          : fileName
            ? uploadedAt
              ? "border-[var(--success)] bg-[var(--success-soft)]"
              : "border-[var(--warning)] bg-[var(--warning-soft)]"
            : "border-[var(--border-color)] bg-[var(--muted-surface)]/70"
      } ${disabled ? "bg-[var(--muted-surface)]" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {label}
            {required ? <span className="text-[var(--danger)]"> *</span> : null}
          </span>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            {helperText ?? "Upload a clear and readable file. Latest copy is recommended."}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
            fileName
              ? uploadedAt
                ? "border border-[var(--success)] bg-[var(--surface)] text-[var(--success)]"
                : "border border-[var(--warning)] bg-[var(--surface)] text-[var(--warning)]"
              : "border border-[var(--border-color)] bg-[var(--surface)] text-[var(--foreground)]"
          }`}
        >
          {fileName ? (uploadedAt ? "Uploaded" : "Selected") : "Pending"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center rounded-lg bg-[var(--success)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--primary-strong)]"
        >
          {fileName ? "Replace Selection" : "Choose File"}
        </label>
        <span className="text-xs text-[var(--ink-muted)]">
          {fileName
            ? "Ready to submit after final application submission."
            : "Accepted format follows current backend validation rules."}
        </span>
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          onFileChange(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <p className="mt-2 text-xs text-[var(--ink-muted)]">
        {fileName ? `Selected: ${fileName}` : "No file selected"}
      </p>
        {fileName && previewUrl ? (
          <div className="mt-2">
            <DocumentDownloadButton
              url={previewUrl}
              fileName={fileName}
              className="inline-flex rounded-md border border-[var(--border-color)] px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted-surface)] disabled:opacity-60"
            />
          </div>
        ) : null}
      {fileName && !uploadedAt ? <p className="mt-1 text-xs text-[var(--ink-muted)]">Ready to submit</p> : null}
      {uploadedAt && fileName ? (
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Uploaded: {formatUploadTimestamp(uploadedAt)}
        </p>
      ) : null}
      {fileName && onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="mt-2 rounded-md border border-[var(--danger)] px-2 py-1 text-xs text-[var(--danger)] disabled:border-[var(--border-color)] disabled:bg-[var(--muted-surface)] disabled:text-[var(--ink-muted)]"
        >
          Remove
        </button>
      ) : null}
      {error && !fileName ? (
        <p className="mt-1 text-xs font-medium text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}
