import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApplicantBusinessLocationClient } from "@/components/dashboard/applicant-business-location-client";
import { normalizeGeoMapLocation } from "@/lib/locations";

export const metadata = {
  title: "Business Location Submission",
};

export default async function BusinessLocationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "APPLICANT") {
    redirect("/dashboard");
  }

  const applications = await prisma.application.findMany({
    where: {
      applicantId: session.user.id,
      status: {
        in: ["RELEASED", "COMPLETED"],
      },
    },
    include: {
      businessLocation: {
        include: {
          application: {
            select: {
              id: true,
              applicationNumber: true,
              businessName: true,
              businessType: true,
              lineOfBusiness: true,
              businessAddress: true,
              type: true,
              status: true,
              permit: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
      permit: {
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const serializedApplications = applications.map((application) => ({
    id: application.id,
    applicationNumber: application.applicationNumber,
    businessName: application.businessName,
    businessType: application.businessType,
    lineOfBusiness: application.lineOfBusiness,
    businessAddress: application.businessAddress,
    status: application.status,
    permitStatus: application.permit?.status ?? null,
    location: application.businessLocation
      ? normalizeGeoMapLocation(application.businessLocation)
      : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Business Location Submission
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Submit your released or completed business location and required business category for BPLO review before it appears on the GeoMap.
        </p>
      </div>

      <ApplicantBusinessLocationClient
        initialApplications={JSON.parse(JSON.stringify(serializedApplications))}
      />
    </div>
  );
}
