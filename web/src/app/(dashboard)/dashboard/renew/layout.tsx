import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { RenewalShell } from "@/components/dashboard/renewal-shell";

/**
 * Renewal Portal Layout
 * Wraps all /dashboard/renew/* routes with the renewal sidebar
 * Performs eligibility check and redirects ineligible users
 */
export default async function RenewalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Account status check - must be ACTIVE
  if (session.user.status !== "ACTIVE") {
    redirect("/dashboard");
  }

  // Only APPLICANT role can access renewal portal
  if (session.user.role !== "APPLICANT") {
    redirect("/dashboard");
  }

  // Check if applicant is eligible for renewal (has ACTIVE or EXPIRED permits)
  const permits = await prisma.permit.findMany({
    where: {
      application: {
        applicantId: session.user.id,
      },
      status: {
        in: ["ACTIVE", "EXPIRED"],
      },
    },
    take: 1,
  });

  // If not eligible, deny access to renewal portal
  if (permits.length === 0) {
    redirect("/dashboard");
  }

  // User is authenticated, authorized, and eligible for renewal
  // Pass to client-side RenewalShell which manages toggle state
  return (
    <RenewalShell user={session.user}>
      {children}
    </RenewalShell>
  );
}
