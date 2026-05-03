"use client";

interface UploadSlotProps {
  label: string;
  required?: boolean;
  onFileChange: (file: File | null) => void;
  onRemove?: () => void;
  fileName?: string;
  disabled?: boolean;
  helperText?: string;
}

export function UploadSlot({
  label,
  required = false,
  onFileChange,
  onRemove,
  fileName,
  disabled = false,
  helperText,
}: UploadSlotProps) {
  const inputId = `upload-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div
      className={`block rounded-2xl border border-dashed p-4 transition-colors ${
        fileName
          ? "border-green-400 bg-green-50/80"
          : "border-green-300 bg-green-50/40"
      } ${disabled ? "bg-slate-50" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="text-sm font-medium text-green-900">
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
              ? "border border-green-200 bg-white text-green-700"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          {fileName ? "Uploaded" : "Pending"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
        >
          {fileName ? "Replace File" : "Choose File"}
        </label>
        <span className="text-xs text-slate-600">Accepted format follows current backend validation rules.</span>
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
    </div>
  );
}
