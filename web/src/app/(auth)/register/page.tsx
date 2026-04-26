"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push(
        `/verify-otp?userId=${encodeURIComponent(data.userId)}&email=${encodeURIComponent(formData.email)}&type=EMAIL_VERIFICATION`
      );
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full min-h-screen relative flex items-center justify-center p-4 py-12">
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

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Green Gradient Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-white text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <Image
                  src="/assets/logo.png"
                  alt="Municipality of Enrique B. Magalona Logo"
                  width={60}
                  height={60}
                  className="object-contain rounded-sm"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
            <p className="text-green-100 text-sm">
              Municipality of Enrique B. Magalona
            </p>
            <p className="text-green-100 text-xs mt-1">
              Register to apply for a business permit online
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-4 rounded-lg bg-[var(--danger-light)] p-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FloatingLabelInput
                  id="firstName"
                  name="firstName"
                  type="text"
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
                <FloatingLabelInput
                  id="lastName"
                  name="lastName"
                  type="text"
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
              </div>

              <FloatingLabelInput
                id="middleName"
                name="middleName"
                type="text"
                label="Middle Name (Optional)"
                value={formData.middleName}
                onChange={handleChange}
                autoComplete="additional-name"
              />

              <FloatingLabelInput
                id="email"
                name="email"
                type="email"
                label="Email Address"
                required
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />

              <FloatingLabelInput
                id="phone"
                name="phone"
                type="tel"
                label="Phone Number (Optional)"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />

              <FloatingLabelInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                required
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
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
                hint="Must include uppercase, lowercase, number, and special character"
              />

              <FloatingLabelInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-medium underline text-green-600 hover:text-green-700"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-medium underline text-green-600 hover:text-green-700"
                  >
                    Privacy Policy
                  </Link>
                  , in accordance with Republic Act 10173 (Data Privacy Act).
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-green-600/30"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-green-600 hover:text-green-700"
              >
                Sign in
              </Link>
            </p>
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
