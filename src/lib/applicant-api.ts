import { auth } from "@/lib/auth";

export async function requireApplicantSession() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "APPLICANT") {
    return null;
  }

  return session;
}
