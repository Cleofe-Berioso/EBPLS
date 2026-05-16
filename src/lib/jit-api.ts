import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireJitSession() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "JIT") {
    return null;
  }

  const activeJit = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!activeJit || activeJit.role !== "JIT" || !activeJit.isActive) {
    return null;
  }

  return session;
}