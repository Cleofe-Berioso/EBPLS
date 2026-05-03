"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { googleSignInAction, loginAction } from "@/app/login/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

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
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign In</h1>
          <p className="mt-2 text-sm text-slate-600">Electronic Business Permits and Licensing System</p>
        </div>

        <div className="p-8">
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {state.error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Account Email
              </label>
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
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Account Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-10 text-slate-900 outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  placeholder="Enter your password"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-slate-700">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg border border-green-700 bg-green-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-800 disabled:bg-green-400"
            >
              {isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form action={googleSignInAction}>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-[15px] font-medium text-slate-900 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/google2.png"
                alt=""
                aria-hidden="true"
                className="h-7 w-7 object-contain"
              />
              <span>Sign in with Google</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-700">
              Don&apos;t have an account?{" "}
              <a
                href="/register"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Register as Applicant
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
