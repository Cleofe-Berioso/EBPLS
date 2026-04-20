import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminUsersClient } from "@/components/dashboard/admin-users-client";

export const metadata = { title: "Manage Users" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "BPLO_OFFICE") redirect("/dashboard");

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return (
    <AdminUsersClient
      initialUsers={JSON.parse(JSON.stringify(users))}
      initialTotal={total}
    />
  );
}
