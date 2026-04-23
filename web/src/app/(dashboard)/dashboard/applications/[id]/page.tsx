"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading";
import { FileText, Upload, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ApplicationDetail {
  id: string;
  applicationNumber: string;
  type: string;
  status: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  businessBarangay?: string;
  businessCity?: string;
  businessProvince?: string;
  businessZipCode?: string;
  businessPhone?: string;
  businessEmail?: string;
  tinNumber?: string;
  dtiSecRegistration?: string;
  capitalInvestment?: number;
  numberOfEmployees?: number;
  businessArea?: number;
  grossSales?: number;
  additionalData?: Record<string, any>;
  applicant: { id: string; firstName: string; lastName: string; email: string };
  dateSubmitted: string;
  documents: {
    id: string;
    originalName: string;
    documentType: string;
    status: string;
  }[];
  payment?: {
    status: string;
    amountPaid?: number;
    totalAmount?: number;
  };
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplication = useCallback(async () => {
    if (!id) {
      setError("Application not found");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (res.ok) {
        setApplication(data.application);
      } else {
        setError("Application not found");
      }
    } catch {
      setError("Failed to load application details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-4">
        <Alert variant="error">
          {error || "Application not found"}
        </Alert>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const statusIcon = {
    DRAFT: <Clock className="h-5 w-5 text-[var(--background)]0" />,
    SUBMITTED: <Clock className="h-5 w-5 text-blue-500" />,
    UNDER_REVIEW: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    ENDORSED: <CheckCircle className="h-5 w-5 text-indigo-500" />,
    APPROVED: <CheckCircle className="h-5 w-5 text-green-500" />,
    REJECTED: <AlertCircle className="h-5 w-5 text-red-500" />,
  }[application.status] || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{application.applicationNumber}</h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="mt-1 text-[var(--text-secondary)]">{application.businessName}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>← Back</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--background)]0">Application Type</dt>
                  <dd className="mt-1 font-medium">{application.type}</dd>
                </div>
                <div>
                  <dt className="text-[var(--background)]0">Business Name</dt>
                  <dd className="mt-1 font-medium">{application.businessName}</dd>
                </div>
                <div>
                  <dt className="text-[var(--background)]0">Business Type</dt>
                  <dd className="mt-1 font-medium">{application.businessType}</dd>
                </div>
                {application.additionalData?.lineOfBusiness && (
                  <div>
                    <dt className="text-[var(--background)]0">Line of Business</dt>
                    <dd className="mt-1 font-medium">{application.additionalData.lineOfBusiness}</dd>
                  </div>
                )}
                {application.businessPhone && (
                  <div>
                    <dt className="text-[var(--background)]0">Business Phone</dt>
                    <dd className="mt-1 font-medium">{application.businessPhone}</dd>
                  </div>
                )}
                {application.businessEmail && (
                  <div>
                    <dt className="text-[var(--background)]0">Business Email</dt>
                    <dd className="mt-1 font-medium">{application.businessEmail}</dd>
                  </div>
                )}
                {application.dtiSecRegistration && (
                  <div>
                    <dt className="text-[var(--background)]0">DTI / SEC / CDA Registration</dt>
                    <dd className="mt-1 font-medium">{application.dtiSecRegistration}</dd>
                  </div>
                )}
                {application.tinNumber && (
                  <div>
                    <dt className="text-[var(--background)]0">TIN</dt>
                    <dd className="mt-1 font-medium">{application.tinNumber}</dd>
                  </div>
                )}
                {application.capitalInvestment && (
                  <div>
                    <dt className="text-[var(--background)]0">Capital Investment</dt>
                    <dd className="mt-1 font-medium">₱{application.capitalInvestment.toLocaleString()}</dd>
                  </div>
                )}
                {application.additionalData?.assetValue && (
                  <div>
                    <dt className="text-[var(--background)]0">Asset Value</dt>
                    <dd className="mt-1 font-medium">₱{parseFloat(application.additionalData.assetValue).toLocaleString()}</dd>
                  </div>
                )}
                {application.numberOfEmployees && (
                  <div>
                    <dt className="text-[var(--background)]0">Number of Employees</dt>
                    <dd className="mt-1 font-medium">{application.numberOfEmployees}</dd>
                  </div>
                )}
                {application.businessArea && (
                  <div>
                    <dt className="text-[var(--background)]0">Business Area (sqm)</dt>
                    <dd className="mt-1 font-medium">{application.businessArea.toLocaleString()}</dd>
                  </div>
                )}
                {application.additionalData?.monthlyRental && (
                  <div>
                    <dt className="text-[var(--background)]0">Monthly Rental</dt>
                    <dd className="mt-1 font-medium">₱{parseFloat(application.additionalData.monthlyRental).toLocaleString()}</dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-[var(--background)]0">Business Address</dt>
                  <dd className="mt-1 font-medium">
                    {[application.businessAddress, application.businessBarangay, application.businessCity, application.businessProvince, application.businessZipCode]
                      .filter(Boolean)
                      .join(", ")}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Owner Information */}
          {(application.additionalData?.ownerName || application.additionalData?.ownerBirthdate || application.additionalData?.ownerResidenceAddress || application.additionalData?.ownerPhone) && (
            <Card>
              <CardHeader>
                <CardTitle>Owner / Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  {application.additionalData?.ownerName && (
                    <div>
                      <dt className="text-[var(--background)]0">Owner&rsquo;s Name</dt>
                      <dd className="mt-1 font-medium">{application.additionalData.ownerName}</dd>
                    </div>
                  )}
                  {application.additionalData?.ownerBirthdate && (
                    <div>
                      <dt className="text-[var(--background)]0">Birthdate</dt>
                      <dd className="mt-1 font-medium">{new Date(application.additionalData.ownerBirthdate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {application.additionalData?.ownerResidenceAddress && (
                    <div className="sm:col-span-2">
                      <dt className="text-[var(--background)]0">Residence Address</dt>
                      <dd className="mt-1 font-medium">{application.additionalData.ownerResidenceAddress}</dd>
                    </div>
                  )}
                  {application.additionalData?.ownerPhone && (
                    <div>
                      <dt className="text-[var(--background)]0">Mobile Number</dt>
                      <dd className="mt-1 font-medium">{application.additionalData.ownerPhone}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents ({application.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.documents.length === 0 ? (
                <p className="text-sm text-[var(--background)]0">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {application.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.originalName}</p>
                          <p className="text-xs text-[var(--background)]0">{doc.documentType.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                  ))}
                </div>
              )}
              <Link href={`/dashboard/documents`}>
                <Button variant="outline" className="mt-4 w-full">
                  <Upload className="h-4 w-4 mr-2" /> Manage Documents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-[var(--background)]0 uppercase">Current Status</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  {statusIcon}
                  {application.status.replace(/_/g, " ")}
                </p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-[var(--background)]0">Submitted</p>
                <p className="mt-1 text-sm font-medium">{new Date(application.dateSubmitted).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          {application.payment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--background)]0">Status</dt>
                    <dd><StatusBadge status={application.payment.status} /></dd>
                  </div>
                  {application.payment.amountPaid && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--background)]0">Amount Paid</dt>
                      <dd className="font-medium">₱{application.payment.amountPaid.toLocaleString()}</dd>
                    </div>
                  )}
                  {application.payment.totalAmount && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--background)]0">Total Due</dt>
                      <dd className="font-medium">₱{application.payment.totalAmount.toLocaleString()}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Applicant</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">{application.applicant.firstName} {application.applicant.lastName}</p>
              <p className="text-[var(--text-secondary)]">{application.applicant.email}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
