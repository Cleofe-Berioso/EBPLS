"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";

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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!result?.ok) {
        setError(result?.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full min-h-screen relative flex items-center justify-center p-4">
      {/* Blurred Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/login-bg.png"
          alt="Municipal Hall Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 backdrop-blur-md bg-white/30" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Green Gradient Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-white text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <Image
                  src="/assets/logo.png"
                  alt="Municipality of Enrique B. Magalona Logo"
                  width={80}
                  height={80}
                  className="object-contain rounded-sm"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">eBPLS System</h1>
            <p className="text-green-100 text-sm">
              Municipality of Enrique B. Magalona
            </p>
            <p className="text-green-100 text-xs mt-1">
              Electronic Business Permits and Licensing
            </p>
          </div>

          {/* Login Form */}
          <div className="p-8">
            {justVerified && (
              <div className="mb-4 rounded-lg bg-[var(--success-light)] border border-green-200 px-4 py-3 text-sm text-[var(--success)]">
                ✓ Email verified successfully! You can now sign in.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-[var(--danger-light)] p-3 text-sm text-[var(--danger)]">
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
                startAdornment={<Mail className="h-5 w-5" />}
              />

              <FloatingLabelInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                startAdornment={<Lock className="h-5 w-5" />}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-green-600/30"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Create Account Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Register as Applicant
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500">
              © 2026 Municipality of Enrique B. Magalona — BPLO. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
