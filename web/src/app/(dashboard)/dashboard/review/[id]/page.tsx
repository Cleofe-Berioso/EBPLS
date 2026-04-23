"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { ArrowLeft, CheckCircle, XCircle, FileText } from "lucide-react";

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
  tinNumber?: string;
  dtiSecRegistration?: string;
  capitalInvestment?: number;
  numberOfEmployees?: number;
  applicant: { firstName: string; lastName: string; email: string };
  documents: {
    id: string;
    originalName: string;
    documentType: string;
    status: string;
    version: number;
  }[];
}

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setError("Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleAction = async (action: "APPROVE" | "REJECT" | "REQUEST_REVISION") => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/applications/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Action failed");
        return;
      }

      setSuccess(
        action === "APPROVE"
          ? "Application approved successfully!"
          : action === "REJECT"
          ? "Application rejected."
          : "Revision requested."
      );

      setTimeout(() => router.push("/dashboard/review"), 1500);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  if (!application) {
    return (
      <Alert variant="error">
        Application not found. <Link href="/dashboard/review" className="underline">Go back</Link>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-[var(--background)]0 hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Reviews
      </button>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl break-words">
            Review: {application.applicationNumber}
          </h1>
          <p className="mt-1 text-sm text-[var(--background)]0">{application.businessName}</p>
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={application.status} />
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-6">
          {success}
        </Alert>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2 lg:order-1 order-2">
          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--background)]0">Applicant</dt>
                  <dd className="font-medium text-[var(--text-primary)]">
                    {application.applicant.firstName} {application.applicant.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--background)]0">Email</dt>
                  <dd className="font-medium text-[var(--text-primary)]">
                    {application.applicant.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--background)]0">Business Name</dt>
                  <dd className="font-medium text-[var(--text-primary)]">
                    {application.businessName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--background)]0">Business Type</dt>
                  <dd className="font-medium text-[var(--text-primary)]">
                    {application.businessType}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[var(--background)]0">Address</dt>
                  <dd className="font-medium text-[var(--text-primary)]">
                    {[
                      application.businessAddress,
                      application.businessBarangay,
                      application.businessCity,
                      application.businessProvince,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </dd>
                </div>
                {application.tinNumber && (
                  <div>
                    <dt className="text-[var(--background)]0">TIN</dt>
                    <dd className="font-medium text-[var(--text-primary)]">
                      {application.tinNumber}
                    </dd>
                  </div>
                )}
                {application.dtiSecRegistration && (
                  <div>
                    <dt className="text-[var(--background)]0">DTI/SEC Reg.</dt>
                    <dd className="font-medium text-[var(--text-primary)]">
                      {application.dtiSecRegistration}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents ({application.documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {application.documents.length === 0 ? (
                <p className="text-sm text-[var(--background)]0">No documents uploaded.</p>
              ) : (
                <ul className="divide-y">
                  {application.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {doc.originalName}
                          </p>
                          <p className="text-xs text-[var(--background)]0">
                            {doc.documentType.replace(/_/g, " ")} · v{doc.version}
                          </p>
                        </div>
                      </div>
                      <div className="pl-8 sm:pl-0 flex-shrink-0">
                        <StatusBadge status={doc.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Actions Sidebar */}
        <div className="space-y-6 order-1 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  label="Comments / Notes"
                  name="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add review comments..."
                />

                <div className="space-y-2">
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={() => handleAction("APPROVE")}
                    loading={submitting}
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="warning"
                    className="w-full"
                    onClick={() => handleAction("REQUEST_REVISION")}
                    loading={submitting}
                  >
                    Request Revision
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleAction("REJECT")}
                    loading={submitting}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
