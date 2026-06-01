import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit-log";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, password, confirmPassword } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  if (!email || typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json({ error: "Email address is required." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });
  }

  if (confirmPassword !== password) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "BPLO",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  void createAuditLog({
    actorId: session.user.id,
    actorName: session.user.name ?? session.user.email ?? null,
    actorRole: "SUPER_ADMIN",
    action: "STAFF_ACCOUNT_CREATED",
    module: "USER_MANAGEMENT",
    entityType: "USER",
    entityId: user.id,
    description: "Super Admin created new BPLO staff account",
    metadata: {
      newUserId: user.id,
      newUserEmail: user.email,
      newUserRole: "BPLO",
    },
  });

  return NextResponse.json(
    {
      success: true,
      user: {
        ...user,
        status: user.isActive ? "ACTIVE" : "DISABLED",
      },
    },
    { status: 201 }
  );
}
