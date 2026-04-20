import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminLocationsClient } from "@/components/dashboard/admin-locations-client";
import type { BusinessLocation, Application } from "@prisma/client";

export const metadata = {
  title: "Business Locations | Admin",
};

type LocationWithApp = BusinessLocation & {
  application: Pick<Application, "id" | "applicationNumber" | "businessName" | "businessType"> | null;
};

export default async function AdminLocationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "BPLO_OFFICE") {
    redirect("/dashboard");
  }

  let locations: LocationWithApp[] = [];

  try {
    locations = await prisma.businessLocation.findMany({
      take: 15,
      include: {
        application: {
          select: {
            id: true,
            applicationNumber: true,
            businessName: true,
            businessType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    // Return empty array if there's a database error (table might not exist yet)
    locations = [];
  }

  return (
    <div className="p-6">
      <AdminLocationsClient
        initialLocations={JSON.parse(JSON.stringify(locations))}
      />
    </div>
  );
}
