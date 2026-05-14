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

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
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
    {}
  );

  return NextResponse.json({ success: true });
}
