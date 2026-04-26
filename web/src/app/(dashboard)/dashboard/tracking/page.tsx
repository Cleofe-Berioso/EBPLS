import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { Search } from "lucide-react";
import { TrackingClient } from "@/components/dashboard/tracking-client";

export const metadata = { title: "Track Applications" };

export default async function TrackingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const applications = await prisma.application.findMany({
    where: { applicantId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      history: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Track Applications</h1>
        <p className="mt-1 text-gray-600">
          Monitor the real-time status of your permit applications
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8 text-[var(--text-muted)]" />}
          title="No applications to track"
          description="Submit an application first to start tracking its progress."
          action={{ label: "New Application", href: "/dashboard/applications/new" }}
        />
      ) : (
        <TrackingClient initialApplications={JSON.parse(JSON.stringify(applications))} />
      )}
    </div>
  );
}
