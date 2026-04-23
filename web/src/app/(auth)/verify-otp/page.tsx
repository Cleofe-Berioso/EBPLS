"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Mail, Loader2 } from "lucide-react";

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params?.get("userId") ?? "";
  const email = params?.get("email") ?? "";
  const type = params?.get("type") ?? "EMAIL_VERIFICATION";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  if (!userId) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Invalid Verification Link</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          This link is missing required information. Please register again.
        </p>
        <Link
          href="/register"
          className="inline-block bg-[var(--accent)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)]"
        >
          Back to Register
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Please enter the complete 6-digit OTP."); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, userId, type }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed. Please try again."); return; }
      setSuccess(data.message || "Verified successfully!");
      if (data.verified) {
        setTimeout(() => router.push("/login?verified=1"), 2000);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to resend OTP."); return; }
      setSuccess("A new OTP has been sent to your email.");
      setCountdown(60);
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-7 w-7 text-[var(--accent)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Verify Your Email</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          We sent a 6-digit code to{" "}
          {email ? <span className="font-medium text-[var(--text-primary)]">{email}</span> : "your registered email"}.
          Enter it below to activate your account.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-[var(--danger-light)] border border-red-200 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-[var(--success-light)] border border-green-200 px-4 py-3 text-sm text-[var(--success)]">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 text-center">
            One-Time Password (OTP)
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            placeholder="000000"
            className="block w-full rounded-lg border border-[var(--border)] px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <p className="mt-1.5 text-center text-xs text-[var(--background)]0">The code expires in 15 minutes</p>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Verifying…" : "Verify OTP"}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Didn&apos;t receive the code?{" "}
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? "Sending…" : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
          </button>
        </p>
        <p className="text-sm">
          <Link href="/login" className="text-[var(--background)]0 hover:text-[var(--text-primary)]">← Back to Login</Link>
        </p>
      </div>
    </>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--accent-light)] to-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md">        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Shield className="h-8 w-8 text-[var(--accent)] sm:h-10 sm:w-10 flex-shrink-0" />
            <span className="text-lg font-bold text-[var(--text-primary)] sm:text-2xl">Business Permit System</span>
          </Link>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
            </div>
          }>
            <VerifyOtpForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
