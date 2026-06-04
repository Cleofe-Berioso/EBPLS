import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-log";

export async function POST(
  req: Request,
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { temporaryPassword, confirmPassword } = body as Record<string, unknown>;
  if (!temporaryPassword || typeof temporaryPassword !== "string" || temporaryPassword.length < 8) {
    return NextResponse.json(
      { error: "Temporary password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (confirmPassword !== temporaryPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Super Admin password resets are restricted from this screen." },
      { status: 403 }
    );
  }

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Audit log — record the action but never the password itself.
  void createAuditLog({
    actorId: session.user.id,
    actorName: session.user.name ?? session.user.email ?? null,
    actorRole: "SUPER_ADMIN",
    action: "PASSWORD_RESET",
    module: "USER_MANAGEMENT",
    entityType: "USER",
    entityId: target.id,
    description: `Super Admin reset password for ${target.role} account`,
    metadata: {
      targetUserId: target.id,
      targetRole: target.role,
      // The actual password is intentionally NOT logged.
    },
  });

  return NextResponse.json({ success: true });
}
