import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { prisma } from "@/lib/prisma";
import { createAuditLog, logUserManagementAction } from "@/lib/audit-log";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  if (session.user.id === userId) {
    return NextResponse.json({ error: "You cannot disable your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!target.isActive) {
    return NextResponse.json({ success: true, message: "User is already disabled." });
  }

  if (target.role === "SUPER_ADMIN") {
    const activeSuperAdmins = await prisma.user.count({
      where: { role: "SUPER_ADMIN", isActive: true },
    });

    if (activeSuperAdmins <= 1) {
      return NextResponse.json(
        { error: "Cannot disable the last active IT Administrator account." },
        { status: 400 }
      );
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  if (target.role === "JIT") {
    void createAuditLog({
      actorId: session.user.id,
      actorName: session.user.name ?? session.user.email ?? null,
      actorRole: "SUPER_ADMIN",
      action: "SUPERADMIN_DISABLED_JIT_INSPECTOR",
      module: "USER_MANAGEMENT",
      entityType: "USER",
      entityId: target.email,
      description: `IT Administrator disabled JIT inspector account${reason ? `: ${reason}` : ""}`,
      metadata: {
        targetUserId: target.id,
        targetName: target.name,
        targetEmail: target.email,
        targetRole: target.role,
        reason: reason || null,
      },
    });
  }

  // Audit: User disabled
  void logUserManagementAction(
    session.user.id,
    session.user.name ?? session.user.email ?? null,
    "SUPER_ADMIN",
    userId,
    userId,
    "DEACTIVATED",
    "ACTIVE",
    "INACTIVE",
    `User disabled: ${target.role}`,
    { role: target.role, targetName: target.name, targetEmail: target.email, reason: reason || null }
  );

  return NextResponse.json({ success: true });
}
