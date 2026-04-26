import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminLocationsClient } from "@/components/dashboard/admin-locations-client";
import {
  EB_MAGALONA_DB_FILTER,
  EB_MAGALONA_OUTSIDE_DB_FILTER,
  GEO_MAP_LOCATION_INCLUDE,
  LOCATION_ELIGIBLE_APPLICATION_STATUSES,
  LOCATION_REVIEWABLE_STATUSES,
  normalizeGeoMapLocation,
  type GeoMapLocationRecord,
} from "@/lib/locations";

export const metadata = {
  title: "Business GeoMap",
};

export default async function AdminLocationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "BPLO_OFFICE") {
    redirect("/dashboard");
  }

  let approvedLocations: GeoMapLocationRecord[] = [];
  let submissions: GeoMapLocationRecord[] = [];
  let hiddenOutsideBoundaryCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  try {
    const [approvedRows, reviewRows, outsideCount, pendingRows, rejectedRows] = await Promise.all([
      prisma.businessLocation.findMany({
        where: {
          status: "APPROVED",
          application: {
            status: {
              in: [...LOCATION_ELIGIBLE_APPLICATION_STATUSES],
            },
          },
          ...EB_MAGALONA_DB_FILTER,
        },
        include: GEO_MAP_LOCATION_INCLUDE,
        orderBy: { reviewedAt: "desc" },
      }),
      prisma.businessLocation.findMany({
        where: {
          status: {
            in: [...LOCATION_REVIEWABLE_STATUSES],
          },
        },
        include: GEO_MAP_LOCATION_INCLUDE,
        orderBy: { submittedAt: "desc" },
      }),
      prisma.businessLocation.count({
        where: EB_MAGALONA_OUTSIDE_DB_FILTER,
      }),
      prisma.businessLocation.count({
        where: { status: "SUBMITTED" },
      }),
      prisma.businessLocation.count({
        where: { status: "REJECTED" },
      }),
    ]);

    approvedLocations = approvedRows.map((location) => normalizeGeoMapLocation(location));
    submissions = reviewRows.map((location) => normalizeGeoMapLocation(location));
    hiddenOutsideBoundaryCount = outsideCount;
    pendingCount = pendingRows;
    rejectedCount = rejectedRows;
  } catch (error) {
    console.error("Error fetching locations:", error);
  }

  return (
    <div className="p-6">
      <AdminLocationsClient
        initialLocations={JSON.parse(JSON.stringify(approvedLocations))}
        initialSubmissions={JSON.parse(JSON.stringify(submissions))}
        initialHiddenOutsideBoundaryCount={hiddenOutsideBoundaryCount}
        initialPendingCount={pendingCount}
        initialRejectedCount={rejectedCount}
        canManage={session.user.role === "ADMIN"}
        viewerRole={session.user.role}
      />
    </div>
  );
}
