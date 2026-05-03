"use client";

import { useState } from "react";
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
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
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
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-xl shadow-slate-900/10">
          <div className="border-b border-slate-200 bg-slate-50 px-8 py-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo.png"
                  alt="Municipality of Enrique B. Magalona Logo"
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-700">Municipality eBPLS</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Registration Successful</h1>
              <p className="mt-2 text-sm text-slate-600">Your applicant account is ready for sign in.</p>
          </div>

          <div className="p-8 text-center space-y-4">
            <InfoBanner
              title="Your account is ready"
              description="Your applicant account has been created. You can now sign in."
              variant="success"
            />
            <a
              href="/login"
              className="inline-block w-full rounded-lg border border-green-700 bg-green-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-green-800"
            >
              Go to Login
            </a>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-8 py-4">
            <p className="text-xs text-center text-slate-600">
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
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-xl shadow-slate-900/10">
        <div className="border-b border-slate-200 bg-slate-50 px-8 py-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt="Municipality of Enrique B. Magalona Logo"
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-700">Municipality eBPLS</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create Account</h1>
          <p className="mt-2 text-sm text-slate-600">Register as an applicant to start filing and tracking permits.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {state.status === "error" && (
              <InfoBanner title="Registration issue" description={state.message} variant="danger" />
            )}

            {/* Full Name */}
            <FormField
              label="Full Name"
              htmlFor="name"
              hint="Use your legal name as it appears on government records."
              required
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  placeholder="Juan dela Cruz"
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
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
                  <Phone className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-10 text-slate-900 outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-500 hover:text-slate-700" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-500 hover:text-slate-700" />
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
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-10 text-slate-900 outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5 text-slate-500 hover:text-slate-700" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-500 hover:text-slate-700" />
                  )}
                </button>
              </div>
            </FormField>

            <button
              type="submit"
              disabled={state.status === "loading"}
              className="w-full rounded-lg border border-green-700 bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:bg-green-400"
            >
              {state.status === "loading" ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-700">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-8 py-4">
          <p className="text-xs text-center text-slate-600">
            © 2026 Municipality of Enrique B. Magalona - BPLO. All rights
            reserved.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-center shadow-lg shadow-slate-900/10">
        <p className="text-sm font-medium text-slate-800">
          Need account assistance? Contact BPLO at{" "}
          <a
            href="mailto:support@bplo.gov.ph"
            className="text-green-600 hover:text-green-700"
          >
            support@bplo.gov.ph
          </a>
        </p>
      </div>
    </div>
  );
}
