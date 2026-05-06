"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { googleSignInAction } from "@/app/login/actions";

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setErrorMessage("Invalid email or password.");
        return;
      }

      router.push("/auth/redirect");
      router.refresh();
    } catch {
      setErrorMessage("Unable to sign in right now. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl backdrop-blur-md">
        <div className="bg-[#0b8754] px-8 py-8 text-center text-white">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt="Municipality of Enrique B. Magalona Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#bbf7d0]">Municipality eBPLS</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Sign In</h1>
          <p className="mt-2 text-sm text-[#d1fae5]">Electronic Business Permits and Licensing System</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Account Email
              </label>
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
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20 bg-slate-50/50"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Account Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0b8754] focus:ring-2 focus:ring-[#0b8754]/20 bg-slate-50/50"
                  placeholder="Enter your password"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="w-4 h-4 text-[#0b8754] border-gray-300 rounded focus:ring-[#0b8754]"
                />
                <span className="ml-2 text-sm text-slate-700">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-[#0b8754] hover:text-[#096a42] font-semibold"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl border border-[#0b8754] bg-[#0b8754] px-4 py-3 font-semibold text-white transition-all hover:bg-[#096a42] disabled:bg-[#0b8754]/60 shadow-sm"
            >
              {isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form action={googleSignInAction}>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-[15px] font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/google2.png"
                alt=""
                aria-hidden="true"
                className="h-5 w-5 object-contain"
              />
              <span>Sign in with Google</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <a
                href="/register"
                className="text-[#0b8754] hover:text-[#096a42] font-semibold"
              >
                Register as Applicant
              </a>
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
            className="text-[#0b8754] hover:text-[#096a42] font-semibold"
          >
            support@bplo.gov.ph
          </a>
        </p>
      </div>
    </div>
  );
}
