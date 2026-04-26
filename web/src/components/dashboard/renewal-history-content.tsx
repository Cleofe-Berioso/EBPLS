"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
} from "lucide-react";
import Link from "next/link";
import type { ApplicationStatus } from "@prisma/client";

interface RenewalApplicationData {
  id: string;
  applicationNumber: string;
  previousPermitId?: string;
  businessName: string;
  status: ApplicationStatus;
  type: "NEW" | "RENEWAL" | "CLOSURE";
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  rejectionReason?: string | null;
  permit?: {
    id: string;
    permitNumber: string;
    expiryDate: string;
  };
}

interface RenewalHistoryResponse {
  renewals: RenewalApplicationData[];
  total: number;
  message: string;
}

/**
 * RenewalHistoryContent — Displays past renewal applications
 * Shows status, dates, and actions for each renewal
 */
export function RenewalHistoryContent() {
  const { data, isLoading, error } = useQuery<RenewalHistoryResponse>({
    queryKey: ["renewal-history"],
    queryFn: async () => {
      const res = await fetch("/api/renewals/history");

      if (!res.ok) {
        throw new Error("Failed to fetch renewal history");
      }

      return res.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">
              Unable to load your renewal history. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.renewals || data.renewals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No Renewal History
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              You haven&rsquo;t submitted any renewal applications yet.
            </p>
            <Link href="/dashboard/renew/permit">
              <Button>Start a Renewal</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "PAID":
      case "PERMIT_PREPARED":
      case "READY_FOR_RELEASE":
      case "RELEASED":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "UNDER_REVIEW":
      case "RESUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "RETURNED_FOR_CORRECTION":
      case "PAYMENT_PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "PAID":
      case "PERMIT_PREPARED":
      case "READY_FOR_RELEASE":
      case "RELEASED":
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "UNDER_REVIEW":
      case "RESUBMITTED":
      case "PAYMENT_PENDING":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: ApplicationStatus): string => {
    const labels: Record<ApplicationStatus, string> = {
      DRAFT: "Draft",
      SUBMITTED: "Submitted",
      UNDER_REVIEW: "Under Review",
      RETURNED_FOR_CORRECTION: "Returned for Correction",
      RESUBMITTED: "Resubmitted",
      ASSESSED: "Assessed",
      PAYMENT_PENDING: "Payment Pending",
      PAID: "Paid",
      PERMIT_PREPARED: "Permit Prepared",
      READY_FOR_RELEASE: "Ready for Release",
      RELEASED: "Released",
      COMPLETED: "Completed",
      REJECTED: "Rejected",
      CANCELLED: "Cancelled",
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Renewal History ({data.total})
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Track all your permit renewal applications
        </p>
      </div>

      {/* Renewals List */}
      <div className="space-y-4">
        {data.renewals.map((renewal) => (
          <Card key={renewal.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              {/* Header with status */}
              <div className="flex items-center justify-between border-b p-4 sm:flex-col sm:items-start sm:gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {renewal.businessName}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Application #{renewal.applicationNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(renewal.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(renewal.status)}
                      {getStatusLabel(renewal.status)}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 sm:grid-cols-1">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Submitted
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(renewal.submittedAt)}
                  </p>
                </div>

                {["PAID", "PERMIT_PREPARED", "READY_FOR_RELEASE", "RELEASED", "COMPLETED"].includes(renewal.status) && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Approved
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(renewal.approvedAt)}
                    </p>
                  </div>
                )}

                {renewal.status === "REJECTED" && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Rejection Reason
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      {renewal.rejectionReason || "No reason provided"}
                    </p>
                  </div>
                )}

                {!renewal.rejectionReason && renewal.status !== "REJECTED" && (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Created
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatDate(renewal.createdAt)}
                      </p>
                    </div>

                    {renewal.permit && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Related Permit
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {renewal.permit.permitNumber}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t bg-white p-4 sm:flex-col">
                <Link href={`/dashboard/applications/${renewal.id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 sm:w-full">
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </Link>

                {["READY_FOR_RELEASE", "RELEASED", "COMPLETED"].includes(renewal.status) && (
                  <Link href="/dashboard/renew/claim-schedule">
                    <Button size="sm" className="sm:w-full">
                      Schedule Claim
                    </Button>
                  </Link>
                )}

                {renewal.status === "REJECTED" && (
                  <Link href="/dashboard/renew/permit">
                    <Button size="sm" className="sm:w-full">
                      Start New Renewal
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Renewal Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-1">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-600">
                Total Renewals
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {data.total}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-600">
                Approved
              </p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {data.renewals.filter((r) => ["PAID", "PERMIT_PREPARED", "READY_FOR_RELEASE", "RELEASED", "COMPLETED"].includes(r.status)).length}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-600">
                Pending
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {data.renewals.filter(
                  (r) =>
                    r.status === "DRAFT" ||
                    r.status === "SUBMITTED" ||
                    r.status === "UNDER_REVIEW" ||
                    r.status === "RESUBMITTED" ||
                    r.status === "PAYMENT_PENDING"
                ).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
