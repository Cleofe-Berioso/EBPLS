"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Loader2 } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send reset email. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--accent-light)] to-[var(--background)] px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-[var(--surface)] p-6 sm:p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-2">Check Your Email</h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-2">
              If an account exists for <strong className="text-[var(--text-primary)]">{email}</strong>, you will
              receive password reset instructions shortly.
            </p>
            <p className="text-xs text-[var(--background)]0 mb-6">The link will expire in 15 minutes.</p>
            <Link
              href="/login"
              className="block w-full text-center border border-[var(--border)] text-[var(--text-primary)] px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--surface-muted)] transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--accent-light)] to-[var(--background)] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/login" className="inline-flex items-center gap-2">
            <Shield className="h-10 w-10 text-[var(--accent)]" />
            <span className="text-2xl font-bold text-[var(--text-primary)]">Business Permit System</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[var(--warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Forgot Password?</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Enter your email address and we&apos;ll send you a reset link.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-[var(--danger-light)] border border-red-200 px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FloatingLabelInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputClassName="border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-[var(--accent)]/20"
              labelClassName="bg-[var(--surface)] text-[var(--text-secondary)] peer-focus:text-[var(--accent)] peer-[:not(:placeholder-shown)]:text-[var(--text-primary)]"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending…" : "Send Reset Instructions"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
