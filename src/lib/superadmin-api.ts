import { auth } from "@/lib/auth";

export async function requireSuperAdminSession() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return null;
  }

  return session;
}
