"use client";

import { useState } from "react";
import { previewFromUrl } from "@/lib/browser-download";
import { actionButtonStyles } from "@/components/ui/action-button";

type ButtonSize = "sm" | "md";

interface DocumentPreviewButtonProps {
  url: string;
  label?: string;
  className?: string;
  size?: ButtonSize;
  disabled?: boolean;
}

export function DocumentPreviewButton({
  url,
  label = "View",
  className,
  size = "sm",
  disabled = false,
}: DocumentPreviewButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (busy || disabled || !url) return;
    setBusy(true);
    setError(null);
    try {
      await previewFromUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open preview.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled || busy || !url}
        className={className ?? actionButtonStyles("secondary", size)}
        aria-busy={busy}
      >
        {busy ? "Opening…" : label}
      </button>
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
    </span>
  );
}
