import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { prisma } from "@/lib/prisma";
import { logUserManagementAction } from "@/lib/audit-log";

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

  if (session.user.id === userId) {
    return NextResponse.json({ error: "You cannot disable your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
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
        { error: "Cannot disable the last active Super Admin account." },
        { status: 400 }
      );
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

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
    { role: target.role }
  );

  return NextResponse.json({ success: true });
}
