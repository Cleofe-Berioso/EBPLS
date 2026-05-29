"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

export function RegisterForm() {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "loading" });

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      middleName: (form.elements.namedItem("middleName") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      suffix: (form.elements.namedItem("suffix") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      contactNumber: (form.elements.namedItem("contactNumber") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
      confirmPassword: (form.elements.namedItem("confirmPassword") as HTMLInputElement)
        .value,
    };

    // Client-side confirm check before sending
    if (data.password !== data.confirmPassword) {
      setState({ status: "error", message: "Passwords do not match." });
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Registration failed." });
        return;
      }

      setState({ status: "success" });
    } catch {
      setState({ status: "error", message: "A network error occurred. Please try again." });
    }
  }

  if (state.status === "success") {
    return (
      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl backdrop-blur-md">
          <div className="bg-[#0b8754] px-8 py-8 text-center text-white">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-white p-2 shadow-sm">
                <Image
                  src="/images/logo.png"
                  alt="Municipality of Enrique B. Magalona Logo"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
              </div>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#bbf7d0]">Municipality eBPLS</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Registration Successful</h1>
            <p className="mt-2 text-sm text-[#d1fae5]">Your applicant account is ready for sign in.</p>
          </div>

          <div className="p-8">
            <InfoBanner
              title="Your account is ready"
              description="Your applicant account has been created. You can now sign in."
              variant="success"
            />
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-[#0b8754] bg-[#0b8754] px-4 py-3 font-semibold text-white transition-all hover:bg-[#096a42] shadow-sm"
              >
                Go to Login
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 px-8 py-4">
            <p className="text-[10px] sm:text-xs text-center text-slate-500">
              © 2026 Municipality of Enrique B. Magalona - BPLO. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl backdrop-blur-md">
        <div className="bg-[#0b8754] px-8 py-8 text-center text-white">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-white p-2 shadow-sm">
              <Image
                src="/images/logo.png"
                alt="Municipality of Enrique B. Magalona Logo"
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#bbf7d0]">Municipality eBPLS</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Create Account</h1>
          <p className="mt-2 text-sm text-[#d1fae5]">Register as an applicant to start filing and tracking permits.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {state.status === "error" && (
              <InfoBanner title="Registration issue" description={state.message} variant="danger" />
            )}

            {/* Split Legal Name */}
            <FormField
              label="First Name"
              htmlFor="firstName"
              hint="Use your legal name as it appears on government records."
              required
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20"
                  placeholder="Juan"
                />
              </div>
            </FormField>

            <FormField
              label="Middle Name"
              htmlFor="middleName"
              hint="Optional. Leave blank if not applicable."
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="middleName"
                  name="middleName"
                  type="text"
                  autoComplete="additional-name"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20"
                  placeholder="Santos"
                />
              </div>
            </FormField>

            <FormField
              label="Last Name"
              htmlFor="lastName"
              required
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20"
                  placeholder="Dela Cruz"
                />
              </div>
            </FormField>

            <FormField
              label="Suffix"
              htmlFor="suffix"
              hint="Optional (e.g., Jr., Sr., III)."
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="suffix"
                  name="suffix"
                  type="text"
                  autoComplete="honorific-suffix"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20"
                  placeholder="Jr."
                />
              </div>
            </FormField>

            {/* Email */}
            <FormField
              label="Email Address"
              htmlFor="email"
              hint="Use this email for sign in and application notifications."
              required
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20"
                  placeholder="your.email@example.com"
                />
              </div>
            </FormField>

            {/* Contact Number */}
            <FormField
              label="Contact Number"
              htmlFor="contactNumber"
              hint="Enter an active mobile number for verification follow-ups and notices."
              required
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  autoComplete="tel"
                  required
                  pattern="^(\\+63|0)9\\d{9}$"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20"
                  placeholder="09XX-XXX-XXXX"
                />
              </div>
            </FormField>

            {/* Password */}
            <FormField
              label="Password"
              htmlFor="password"
              hint="Minimum of 8 characters."
              required
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-[#0b8754] transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-[#0b8754] transition-colors" />
                  )}
                </button>
              </div>
            </FormField>

            {/* Confirm Password */}
            <FormField
              label="Confirm Password"
              htmlFor="confirmPassword"
              hint="Re-enter the same password to confirm."
              required
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-[#0b8754] transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-[#0b8754] transition-colors" />
                  )}
                </button>
              </div>
            </FormField>

            <button
              type="submit"
              disabled={state.status === "loading"}
              className="w-full rounded-xl border border-[#0b8754] bg-[#0b8754] px-4 py-3 font-semibold text-white transition-all hover:bg-[#096a42] disabled:bg-[#0b8754]/60 shadow-sm"
            >
              {state.status === "loading" ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-700">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#0b8754] hover:text-[#096a42]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-slate-50 px-8 py-4">
          <p className="text-[10px] sm:text-xs text-center text-slate-500">
            © 2026 Municipality of Enrique B. Magalona - BPLO. All rights
            reserved.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-center shadow-lg backdrop-blur-md">
        <p className="text-sm font-medium text-slate-700">
          Need account assistance? Contact BPLO at{" "}
          <a
            href="mailto:support@bplo.gov.ph"
            className="font-semibold text-[#0b8754] hover:text-[#096a42]"
          >
            support@bplo.gov.ph
          </a>
        </p>
      </div>
    </div>
  );
}
