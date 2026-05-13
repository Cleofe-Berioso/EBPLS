import { notFound, redirect } from "next/navigation";
import { requireApplicantSession } from "@/lib/applicant-api";

/**
 * DEPRECATED (Phase 7): This page is no longer used.
 * Business Location is now integrated into the application form submission flow.
 * Applicants pin their business location directly in the New/Renewal application forms.
 * Coordinates are persisted via the application JSON and synced to BusinessLocation on BPLO release.
 * 
 * This page redirects to My Applications for backward compatibility.
 */
export default async function BusinessLocationPage() {
  const session = await requireApplicantSession();
  if (!session) notFound();

  redirect("/applicant/my-applications");
}
