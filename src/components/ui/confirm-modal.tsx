"use client";

import type { ReactNode } from "react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { Modal } from "@/components/ui/modal";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "default" | "danger";
};

export function ConfirmModal({
  open,
  title,
  message,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  loading = false,
  disabled = false,
  variant = "default",
}: ConfirmModalProps) {
  const confirmVariant = variant === "danger" ? "danger" : "primary";
  const isDisabled = disabled || loading;

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      closeOnBackdropClick={!loading}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={actionButtonStyles("secondary", "sm")}
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={actionButtonStyles(confirmVariant, "sm")}
            onClick={() => void onConfirm()}
            disabled={isDisabled}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {message ? <div className="text-sm leading-6 text-slate-600">{message}</div> : null}
        {children}
      </div>
    </Modal>
  );
}