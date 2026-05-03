import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In — eBPLS | Municipality of Enrique B. Magalona",
  description:
    "Sign in to the Electronic Business Permits and Licensing System (eBPLS).",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 p-4 md:p-6">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/45 via-slate-950/35 to-white/12 backdrop-blur-[3px]" />
      </div>

      <div className="pointer-events-none absolute left-[-8rem] top-12 h-64 w-64 rounded-full bg-emerald-900/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-8rem] h-72 w-72 rounded-full bg-slate-900/20 blur-3xl" />

      <LoginForm />
    </main>
  );
}
