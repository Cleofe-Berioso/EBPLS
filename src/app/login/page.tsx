import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In — eBPLS | Municipality of Enrique B. Magalona",
  description:
    "Sign in to the Electronic Business Permits and Licensing System (eBPLS).",
};

type LoginPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await Promise.resolve(searchParams) : {};
  const email = getSingleParam(params.email).trim();
  const error = getSingleParam(params.error).trim();
  const disabledAccountNotice = error === "account-disabled";
  const hasPasswordQuery = Object.prototype.hasOwnProperty.call(params, "password");

  if (hasPasswordQuery) {
    if (email) {
      redirect(`/login?email=${encodeURIComponent(email)}`);
    }
    redirect("/login");
  }

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

      <LoginForm initialEmail={email} disabledAccountNotice={disabledAccountNotice} />
    </main>
  );
}
