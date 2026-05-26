import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { prisma } from "@/lib/prisma";
import { createAuditLog, logUserManagementAction } from "@/lib/audit-log";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (target.isActive) {
    return NextResponse.json({ success: true, message: "User is already active." });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  if (target.role === "JIT") {
    void createAuditLog({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.email ?? null,
      actorRole: "SUPER_ADMIN",
      action: "SUPERADMIN_ENABLED_JIT_INSPECTOR",
      module: "USER_MANAGEMENT",
      entityType: "USER",
      entityId: target.email,
      description: "Super Admin enabled JIT inspector account",
      metadata: {
        targetUserId: target.id,
        targetName: target.name,
        targetEmail: target.email,
        targetRole: target.role,
      },
    });
  }

  // Audit: User reactivated
  void logUserManagementAction(
    session.user.id,
    session.user.name ?? session.user.email ?? null,
    "SUPER_ADMIN",
    userId,
    userId,
    "ACTIVATED",
    "INACTIVE",
    "ACTIVE",
    `User reactivated`,
    { role: target.role, targetName: target.name, targetEmail: target.email }
  );

  return NextResponse.json({ success: true });
}
