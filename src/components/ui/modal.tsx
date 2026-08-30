"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [onClose, open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--foreground)_55%,transparent)] backdrop-blur-sm"
        aria-hidden="true"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative z-10 flex flex-col overflow-hidden bg-white ${
          size === "full"
            ? "h-full w-full max-h-dvh max-w-none rounded-none border-0 shadow-none"
            : `border border-[var(--border-color)] shadow-2xl sm:rounded-2xl ${
                size === "lg"
                  ? "max-h-[min(92dvh,50rem)] w-full max-w-4xl"
                  : size === "md"
                    ? "max-h-[min(92dvh,44rem)] w-full max-w-2xl"
                    : "max-h-[min(92dvh,38rem)] w-full max-w-lg"
              }`
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ui-surface-header flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="ui-section-heading font-semibold tracking-tight text-[var(--foreground)]">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-white text-[var(--ink-muted)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            aria-label="Close dialog"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 sm:px-5">{children}</div>

        {footer ? (
          <div className="ui-surface-header sticky bottom-0 px-4 py-3.5 sm:px-5">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}