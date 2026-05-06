import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register — eBPLS | Municipality of Enrique B. Magalona",
  description:
    "Create an applicant account in the Electronic Business Permits and Licensing System (eBPLS).",
};

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f7fb] p-4 md:p-6">
      <div
        className="absolute inset-0 z-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_-8%,rgba(11,122,92,0.16),transparent_34%),radial-gradient(circle_at_100%_-12%,rgba(30,109,182,0.1),transparent_36%),linear-gradient(180deg,#f9fbff_0%,#f4f7fb_38%,#eff4f9_100%)]" />
      </div>

      <div
        className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-[calc(100vh-2rem)] items-center justify-center">
        <RegisterForm />
      </div>
    </main>
  );
}
