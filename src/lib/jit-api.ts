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

/**
 * Check if JIT portal is currently enabled globally
 * Returns true if enabled, false if disabled
 */
export async function isJitPortalEnabled(): Promise<boolean> {
  const setting = await prisma.systemFeeSetting.findFirst({
    select: { jitPortalEnabled: true },
    orderBy: { updatedAt: "desc" },
  });
  return setting?.jitPortalEnabled ?? true;
}