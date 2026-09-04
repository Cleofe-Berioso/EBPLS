import { signOut } from "@/lib/auth";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { SuperAdminLayoutClient } from "@/components/superadmin/superadmin-layout-client";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSuperAdminSession();
  // Stale JWT after DB reset / disabled account used to hit notFound() (404).
  // Clear the session and send the user to login instead.
  if (!session) {
    await signOut({ redirectTo: "/login?error=session-expired" });
    return null;
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <SuperAdminLayoutClient userName={session.user.name ?? "IT Administrator"} signOutAction={handleSignOut}>
      {children}
    </SuperAdminLayoutClient>
  );
}
