"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2, Home } from "lucide-react";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justVerified = params?.get("verified") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use NextAuth's signIn function to properly create a session
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Don't auto-redirect so we can handle errors
        callbackUrl: "/dashboard",
      });

      if (!result?.ok) {
        setError(result?.error || "Login failed");
        return;
      }

      // Session cookie should now be set, redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--accent-light)] to-[var(--background)] px-4">
      <div className="w-full max-w-md">        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Shield className="h-8 w-8 text-[var(--accent)] sm:h-10 sm:w-10 flex-shrink-0" />
            <span className="text-lg font-bold text-[var(--text-primary)] sm:text-2xl">
              Business Permit System
            </span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Sign in to your account to continue
          </p>

          {justVerified && (
            <div className="mt-4 rounded-lg bg-[var(--success-light)] border border-green-200 px-4 py-3 text-sm text-[var(--success)]">
              ✓ Email verified successfully! You can now sign in.
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-[var(--danger-light)] p-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text-primary)]"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--text-primary)] placeholder-gray-400 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                placeholder="juan@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-primary)]"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border)] px-4 py-2.5 pr-10 text-[var(--text-primary)] placeholder-gray-400 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Forgot password?
              </Link>
            </div>            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Create an account
            </Link>
          </p>

          <div className="mt-6 border-t border-[var(--border)] pt-6">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              <Home className="h-4 w-4" />
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
