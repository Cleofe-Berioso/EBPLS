import { auth } from "@/lib/auth";

export async function requireJitSession() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "JIT") {
    return null;
  }

  return session;
}