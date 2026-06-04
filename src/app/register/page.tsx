import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register — Business Permit Online System | Municipality of Enrique B. Magalona",
  description:
    "Create an applicant account in the Business Permit Online System.",
};

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 p-4 md:p-6">
      <div
        className="absolute inset-0 z-0"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/images/login-bg.png")' }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-black/10" />
        </div>
      </div>

      <RegisterForm />
    </main>
  );
}
