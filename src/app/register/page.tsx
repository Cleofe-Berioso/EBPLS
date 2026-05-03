import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register — eBPLS | Municipality of Enrique B. Magalona",
  description:
    "Create an applicant account in the Electronic Business Permits and Licensing System (eBPLS).",
};

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-900 p-4 md:p-6">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/45 via-slate-950/35 to-white/12 backdrop-blur-[3px]" />
      </div>

      <div
        className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-emerald-900/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-slate-900/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-[calc(100vh-2rem)] items-center justify-center">
        <RegisterForm />
      </div>
    </main>
  );
}
