import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, contactNumber, password, confirmPassword } = body as Record<string, unknown>;

  // ── Field presence validation ──────────────────────────────────────────────
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  if (!email || typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json({ error: "Email address is required." }, { status: 400 });
  }

  if (!contactNumber || typeof contactNumber !== "string" || contactNumber.trim().length === 0) {
    return NextResponse.json({ error: "Contact number is required." }, { status: 400 });
  }

  const normalizedContactNumber = contactNumber.replace(/[\s-]/g, "");
  const mobileRegex = /^(\+63|0)9\d{9}$/;
  if (!mobileRegex.test(normalizedContactNumber)) {
    return NextResponse.json({ error: "Invalid Philippine mobile number format." }, { status: 400 });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
  }

  if (!password || typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  if (confirmPassword !== password) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  // ── Uniqueness check ───────────────────────────────────────────────────────
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email address already exists." },
      { status: 409 }
    );
  }

  // ── Create user ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "APPLICANT", // always APPLICANT — never configurable via public registration
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    { success: true, user },
    { status: 201 }
  );
}
