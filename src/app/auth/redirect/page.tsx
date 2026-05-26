import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/rbac";

/**
 * Intermediate page that reads the session role and redirects
 * to the appropriate dashboard after a successful login.
 */
export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const home = ROLE_HOME[session.user.role];
  redirect(home ?? "/login");
}
