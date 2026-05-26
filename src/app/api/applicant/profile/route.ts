import { NextResponse } from "next/server";
import { listApplicantBusinessRecords } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";

export async function GET() {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessRecords = await listApplicantBusinessRecords(session.user.id);
  const latestBusinessRecord = businessRecords[0]?.businessInfo ?? null;

  return NextResponse.json({
    profile: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      role: "APPLICANT",
      contactNumber: latestBusinessRecord?.phone ?? null,
      mainOfficeAddress: latestBusinessRecord?.mainOfficeAddress ?? null,
      businessAddress: latestBusinessRecord?.businessAddress ?? null,
      sameAsMainOffice: latestBusinessRecord?.sameAsMainOffice ?? null,
      businessName: latestBusinessRecord?.businessName ?? null,
      tradeName: latestBusinessRecord?.tradeName ?? null,
      registrationNumber: latestBusinessRecord?.registrationNumber ?? null,
    },
  });
}
