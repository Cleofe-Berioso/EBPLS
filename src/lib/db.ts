import { prisma } from "@/lib/prisma";

export type Role = "APPLICANT" | "BPLO" | "SUPER_ADMIN";

export interface DbUser {
  id: string;
  email: string;
  name: string;
  /** bcrypt-hashed password stored in DB */
  passwordHash: string;
  role: Role;
  isActive: boolean;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) return null;

  return {
    ...user,
    role: user.role as Role,
  };
}
