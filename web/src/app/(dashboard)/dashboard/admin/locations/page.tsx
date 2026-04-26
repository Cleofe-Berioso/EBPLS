import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminLocationsClient } from "@/components/dashboard/admin-locations-client";
import {
  EB_MAGALONA_DB_FILTER,
  EB_MAGALONA_OUTSIDE_DB_FILTER,
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

  let locations: GeoMapLocationRecord[] = [];
  let hiddenOutsideBoundaryCount = 0;

  try {
    const [rawLocations, outsideCount] = await Promise.all([
      prisma.businessLocation.findMany({
        where: EB_MAGALONA_DB_FILTER,
        include: {
          application: {
            select: {
              id: true,
              applicationNumber: true,
              businessName: true,
              businessType: true,
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.businessLocation.count({
        where: EB_MAGALONA_OUTSIDE_DB_FILTER,
      }),
    ]);

    locations = rawLocations.map((location) =>
      normalizeGeoMapLocation({
        ...location,
        application: location.application
          ? {
              ...location.application,
              permit: location.application.permit
                ? { status: location.application.permit.status }
                : null,
            }
          : null,
      })
    );
    hiddenOutsideBoundaryCount = outsideCount;
  } catch (error) {
    console.error("Error fetching locations:", error);
    locations = [];
    hiddenOutsideBoundaryCount = 0;
  }

  return (
    <div className="p-6">
      <AdminLocationsClient
        initialLocations={JSON.parse(JSON.stringify(locations))}
        initialHiddenOutsideBoundaryCount={hiddenOutsideBoundaryCount}
        canManage={session.user.role === "ADMIN"}
        viewerRole={session.user.role}
      />
    </div>
  );
}
