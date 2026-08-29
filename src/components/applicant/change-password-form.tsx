"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";

const inputClassName =
  "block w-full rounded-[var(--radius-control)] border border-[var(--border-color)] bg-[var(--surface)] py-2.5 pl-3 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]";

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  show,
  onToggleShow,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        minLength={id === "current-password" ? undefined : 8}
        className={inputClassName}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--ink-muted)] hover:text-[var(--foreground)]"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/applicant/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to change password. Please try again.");
        return;
      }

      setSuccess(data.message ?? "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to change password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <InfoBanner title="Unable to update password" description={error} variant="danger" /> : null}
      {success ? <InfoBanner title="Password updated" description={success} variant="success" /> : null}

      <div className="grid gap-4 md:grid-cols-1 lg:max-w-xl">
        <FormField label="Current Password" htmlFor="current-password" required>
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            placeholder="Enter your current password"
            show={showCurrent}
            onToggleShow={() => setShowCurrent((value) => !value)}
          />
        </FormField>

        <FormField
          label="New Password"
          htmlFor="new-password"
          hint="Minimum of 8 characters."
          required
        >
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            show={showNew}
            onToggleShow={() => setShowNew((value) => !value)}
          />
        </FormField>

        <FormField label="Confirm New Password" htmlFor="confirm-password" required>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            show={showConfirm}
            onToggleShow={() => setShowConfirm((value) => !value)}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={
            submitting ||
            !currentPassword ||
            newPassword.length < 8 ||
            newPassword !== confirmPassword
          }
          className={actionButtonStyles("primary", "md")}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </>
          ) : (
            "Change Password"
          )}
        </button>
      </div>
    </form>
  );
}
