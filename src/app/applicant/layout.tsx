import { signOut } from "@/lib/auth";
import { requireApplicantSession } from "@/lib/applicant-api";
import { ApplicantLayoutClient } from "@/components/applicant/applicant-layout-client";

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireApplicantSession();
  if (!session) {
    await signOut({ redirectTo: "/login?error=session-expired" });
    return null;
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <ApplicantLayoutClient userName={session.user?.name ?? "Applicant"} signOutAction={handleSignOut}>
      {children}
    </ApplicantLayoutClient>
  );
}
