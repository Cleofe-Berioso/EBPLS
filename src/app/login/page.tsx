import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In — Business Permit Online System | Municipality of Enrique B. Magalona",
  description:
    "Sign in to the Business Permit Online System to manage your business permit applications.",
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
  const sessionExpiredNotice = error === "session-expired";
  const hasPasswordQuery = Object.prototype.hasOwnProperty.call(params, "password");

  if (hasPasswordQuery) {
    if (email) {
      redirect(`/login?email=${encodeURIComponent(email)}`);
    }
    redirect("/login");
  }

  return (
    <LoginForm
      initialEmail={email}
      disabledAccountNotice={disabledAccountNotice}
      sessionExpiredNotice={sessionExpiredNotice}
    />
  );
}
