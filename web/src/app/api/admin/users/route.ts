import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import { captureException } from "@/lib/monitoring";

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["BPLO_OFFICE", "MTO"]),
  phone: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "BPLO_OFFICE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role") ?? "";
    const status = searchParams.get("status") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = 15;

    const where = {
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(role ? { role: role as "APPLICANT" | "BPLO_OFFICE" | "MTO" } : {}),
      ...(status ? { status: status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, status: true, lastLoginAt: true, createdAt: true,
          _count: { select: { applications: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize });
  } catch (error) {
    captureException(error, { route: "GET /api/admin/users" });
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "BPLO_OFFICE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createUserSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, role, phone } = validated.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hashedPassword = await hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role,
        phone: phone || null,
        password: hashedPassword,
        status: "ACTIVE",
      },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, status: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_CREATE_USER",
        entity: "User",
        entityId: user.id,
        details: { role, email },
      },
    });

    return NextResponse.json({ user, tempPassword }, { status: 201 });  } catch (error) {
    captureException(error, { route: "POST /api/admin/users" });
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
