import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";

const updateUserSchema = z.object({
  role: z.enum(["APPLICANT", "BPLO_OFFICE", "MTO"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  resetPassword: z.boolean().optional(),
});

function generateSecureTempPassword(length: number): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }

  return result;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "BPLO_OFFICE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      phone: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "BPLO_OFFICE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateUserSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { role, status, firstName, lastName, resetPassword } = validated.data;

    const data: Record<string, unknown> = {};
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;

    let tempPassword: string | undefined;

    if (resetPassword) {
      tempPassword = generateSecureTempPassword(10) + "A1!";
      data.password = await hash(tempPassword, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_UPDATE_USER",
        entity: "User",
        entityId: id,
        details: { changes: Object.keys(data), resetPassword: !!resetPassword },
      },
    });

    return NextResponse.json({
      user,
      ...(tempPassword && { tempPassword }),
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}