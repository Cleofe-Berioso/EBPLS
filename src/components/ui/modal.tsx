"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useState, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  closeOnBackdropClick?: boolean;
  size?: "sm" | "md" | "lg" | "full";
};

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  closeOnBackdropClick = true,
  size = "lg",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        aria-hidden="true"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative z-10 flex flex-col overflow-hidden bg-white ${
          size === "full"
            ? "h-full w-full max-h-screen max-w-none rounded-none border-0 shadow-none"
            : `border border-slate-200 shadow-2xl sm:rounded-2xl ${
                size === "lg"
                  ? "max-h-[min(90vh,52rem)] w-full max-w-4xl"
                  : size === "md"
                    ? "max-h-[min(90vh,48rem)] w-full max-w-2xl"
                    : "max-h-[min(90vh,42rem)] w-full max-w-lg"
              }`
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            aria-label="Close dialog"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>

        {footer ? (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}