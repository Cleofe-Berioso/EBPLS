import { auth } from "@/lib/auth";

export async function requireBploSession() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "BPLO") {
    return null;
  }

  return session;
}
