import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { profileUpdateSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        twoFactorEnabled: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get profile error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Handle password change
    if (action === "change_password") {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Current and new password are required" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isValid = await compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      const hashedPassword = await hash(newPassword, 12);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "PASSWORD_CHANGED",
          entity: "User",
          entityId: session.user.id,
        },
      });

      return NextResponse.json({ message: "Password changed successfully" });
    }

    // Handle 2FA toggle
    if (action === "toggle_2fa") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: !user.twoFactorEnabled },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: user.twoFactorEnabled ? "2FA_DISABLED" : "2FA_ENABLED",
          entity: "User",
          entityId: session.user.id,
        },
      });

      return NextResponse.json({
        message: `Two-factor authentication ${user.twoFactorEnabled ? "disabled" : "enabled"}`,
        twoFactorEnabled: !user.twoFactorEnabled,
      });
    }

    // Handle profile update
    const validated = profileUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: validated.data.firstName,
        lastName: validated.data.lastName,
        middleName: validated.data.middleName || null,
        phone: validated.data.phone || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        role: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_UPDATED",
        entity: "User",
        entityId: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
