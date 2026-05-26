import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Password — eBPLS | Municipality of Enrique B. Magalona",
  description:
    "Reset your eBPLS account password securely using one-time password verification.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 p-4 md:p-6">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/images/login-bg.png")' }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <ForgotPasswordForm />
    </main>
  );
}
