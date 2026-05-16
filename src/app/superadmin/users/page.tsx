import { SuperAdminUsersManager } from "@/components/superadmin/superadmin-users-manager";
import { auth } from "@/lib/auth";

export default async function SuperAdminUsersPage() {
  const session = await auth();
  return <SuperAdminUsersManager currentUserId={session?.user?.id ?? ""} />;
}
