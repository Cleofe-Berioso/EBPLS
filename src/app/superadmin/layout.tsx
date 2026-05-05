import { notFound } from "next/navigation";
import { signOut } from "@/lib/auth";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { SuperAdminLayoutClient } from "@/components/superadmin/superadmin-layout-client";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSuperAdminSession();
  if (!session) notFound();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <SuperAdminLayoutClient userName={session.user.name ?? "Super Admin"} signOutAction={handleSignOut}>
      {children}
    </SuperAdminLayoutClient>
  );
}
