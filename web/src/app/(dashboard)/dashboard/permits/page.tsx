import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Shield, AlertCircle } from "lucide-react";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "EXPIRED":
      return "bg-red-100 text-red-800";
    case "REVOKED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

export default async function PermitsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "ACTIVE") {
    redirect("/dashboard");
  }

  if (session.user.role !== "APPLICANT") {
    redirect("/dashboard");
  }

  const permits = await prisma.permit.findMany({
    where: {
      application: {
        applicantId: session.user.id,
      },
    },
    include: {
      application: {
        select: {
          applicationNumber: true,
        },
      },
    },
    orderBy: {
      issueDate: "desc",
    },
  });

  const activePermits = permits.filter((p) => p.status === "ACTIVE");
  const isRenewalEligible = activePermits.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          My Permits
        </h1>
        <p className="text-[var(--text-secondary)]">
          View your active permits and renewal status
        </p>
      </div>

      {permits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No Permits Issued Yet
            </h3>
            <p className="text-[var(--text-secondary)] text-center max-w-md mb-6">
              You don't have any permits yet. Complete an application and payment
              to get your permit approved and issued.
            </p>
            <Link href="/dashboard/applications/new">
              <Button>Apply for Permit</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {isRenewalEligible && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">Renewal Eligible</h4>
                <p className="text-blue-800 text-sm">
                  You have active permits that may be eligible for renewal.{" "}
                  <Link
                    href="/dashboard/renew"
                    className="font-semibold underline hover:no-underline"
                  >
                    Start Renewal
                  </Link>
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permits.map((permit) => (
              <Card key={permit.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {permit.businessName ?? "N/A"}
                      </CardTitle>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {permit.application?.applicationNumber ?? "N/A"}
                      </p>
                    </div>
                    <StatusBadge status={permit.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[var(--text-secondary)]">Permit No.</p>
                      <p className="font-semibold">{permit.permitNumber}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-secondary)]">Issued</p>
                      <p className="font-semibold">
                        {formatDate(permit.issueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-secondary)]">Valid Until</p>
                      <p className="font-semibold">
                        {formatDate(permit.expiryDate)}
                      </p>
                    </div>
                  </div>

                  {permit.status === "ACTIVE" && (
                    <Link href="/dashboard/renew">
                      <Button variant="outline" className="w-full">
                        Renew Permit
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
