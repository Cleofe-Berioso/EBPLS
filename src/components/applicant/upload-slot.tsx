"use client";

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
}: UploadSlotProps) {
  const inputId = `upload-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div
      className={`block rounded-2xl border border-dashed p-4 transition-colors ${
        error && !fileName
          ? "border-red-400 bg-red-50/70"
          : fileName
            ? uploadedAt
              ? "border-emerald-300 bg-emerald-50/85"
              : "border-amber-300 bg-amber-50/85"
            : "border-slate-300 bg-slate-50/70"
      } ${disabled ? "bg-slate-50" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="text-sm font-medium text-slate-900">
            {label}
            {required ? <span className="text-red-600"> *</span> : null}
          </span>
          <p className="mt-1 text-xs text-slate-600">
            {helperText ?? "Upload a clear and readable file. Latest copy is recommended."}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
            fileName
              ? uploadedAt
                ? "border border-emerald-200 bg-white text-emerald-700"
                : "border border-amber-200 bg-white text-amber-700"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          {fileName ? (uploadedAt ? "Uploaded" : "Selected") : "Pending"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {fileName ? "Replace Selection" : "Choose File"}
        </label>
        <span className="text-xs text-slate-600">
          {fileName
            ? "Ready to submit after final application submission."
            : "Accepted format follows current backend validation rules."}
        </span>
      </div>
      <input
        id={inputId}
        type="file"
        disabled={disabled}
        className="sr-only"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <p className="mt-2 text-xs text-slate-700">
        {fileName ? `Selected: ${fileName}` : "No file selected"}
      </p>
      {fileName && !uploadedAt ? <p className="mt-1 text-xs text-slate-500">Ready to submit</p> : null}
      {uploadedAt && fileName ? (
        <p className="mt-1 text-xs text-slate-500">
          Uploaded: {formatUploadTimestamp(uploadedAt)}
        </p>
      ) : null}
      {fileName && onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="mt-2 rounded-md border border-red-200 px-2 py-1 text-xs text-red-800 disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-600"
        >
          Remove
        </button>
      ) : null}
      {error && !fileName ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
