"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { PageLoading } from "@/components/ui/loading";

interface IssuanceDetail {
  id: string;
  status: string;
  issuedAt: string | null;
  releasedAt: string | null;
  completedAt: string | null;
  staffNotes: string | null;
  mayorSigningStatus?: string | null;
  mayorSignedAt?: string | null;
  mayorSignedBy?: string | null;
  mayorSigningRemarks?: string | null;
  permit: {
    id: string;
    permitNumber: string;
    businessName: string;
    businessAddress: string;
    ownerName: string;
    issueDate: string;
    expiryDate: string;
    status: string;
    application: {
      id: string;
      applicationNumber: string;
    };
  };
  issuedBy: {
    firstName: string;
    lastName: string;
  };
}

export default function IssuanceDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
  const router = useRouter();
  const [issuance, setIssuance] = useState<IssuanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [staffNotes, setStaffNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchIssuance = useCallback(async () => {
    if (!id) {
      setError("Issuance not found");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/issuance/${id}`);
      if (res.ok) {
        const data = await res.json();
        setIssuance(data);
      } else {
        setError("Failed to load issuance details");
      }
      setLoading(false);
    } catch {
      setError("Failed to load issuance details");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssuance();
  }, [fetchIssuance]);

  const handleAction = async (action: "ISSUE" | "RELEASE" | "COMPLETE" | "READY_FOR_MAYOR" | "MAYOR_SIGNED" | "MAYOR_HELD" | "MAYOR_RETURNED") => {
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/issuance/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, staffNotes }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update issuance");
        return;
      }

      setSuccess(data.message);
      setTimeout(() => {
        fetchIssuance();
        setStaffNotes("");
      }, 1000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Permit Issuance</h1>
          <p className="text-[var(--text-secondary)]">Process and issue business permit</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {issuance ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Permit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-[var(--background)]0">Permit Number</span>
                <p className="font-mono font-medium">{issuance.permit.permitNumber}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--background)]0">Business Name</span>
                <p className="font-medium">{issuance.permit.businessName}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--background)]0">Owner</span>
                <p>{issuance.permit.ownerName}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--background)]0">Address</span>
                <p>{issuance.permit.businessAddress}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-[var(--background)]0">Issue Date</span>
                  <p>{new Date(issuance.permit.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--background)]0">Expiry Date</span>
                  <p>{new Date(issuance.permit.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issuance Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-[var(--background)]0">Current Status</span>
                <p className="font-medium text-lg capitalize">
                  {issuance.status.toLowerCase().replace("_", " ")}
                </p>
              </div>

              <Textarea
                label="Staff Notes"
                placeholder="Add any notes about this issuance..."
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                rows={3}
              />

              <div className="flex gap-3">
                {issuance.status === "PREPARED" && (
                  <Button
                    onClick={() => handleAction("ISSUE")}
                    loading={actionLoading}
                    className="flex-1"
                  >
                    Mark as Issued
                  </Button>
                )}
                {issuance.status === "ISSUED" && (
                  <Button
                    onClick={() => handleAction("RELEASE")}
                    loading={actionLoading}
                    variant="success"
                    className="flex-1"
                  >
                    Release Permit
                  </Button>
                )}
                {issuance.status === "RELEASED" && (
                  <Button
                    onClick={() => handleAction("COMPLETE")}
                    loading={actionLoading}
                    variant="success"
                    className="flex-1"
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mayor Signing Workflow */}
          {issuance.permit.application && (
            <Card>
              <CardHeader>
                <CardTitle>Mayor Signing Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-[var(--background)]0">Signing Status</span>
                  <p className="mt-1 font-medium">
                    {issuance.mayorSigningStatus
                      ? issuance.mayorSigningStatus.replace(/_/g, " ")
                      : "Not Started"}
                  </p>
                </div>

                {issuance.mayorSignedAt && (
                  <>
                    <div>
                      <span className="text-sm text-[var(--background)]0">Signed By</span>
                      <p className="mt-1 font-medium">{issuance.mayorSignedBy || "—"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-[var(--background)]0">Signed On</span>
                      <p className="mt-1 font-medium">
                        {new Date(issuance.mayorSignedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}

                {issuance.mayorSigningRemarks && (
                  <div>
                    <span className="text-sm text-[var(--background)]0">Remarks</span>
                    <p className="mt-1 text-sm italic">{issuance.mayorSigningRemarks}</p>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Available Actions:</p>
                  <div className="grid gap-2">
                    {!issuance.mayorSigningStatus && (
                      <Button
                        onClick={() => handleAction("READY_FOR_MAYOR")}
                        loading={actionLoading}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Submit to Mayor
                      </Button>
                    )}
                    {issuance.mayorSigningStatus === "READY_FOR_MAYOR" && (
                      <>
                        <Button
                          onClick={() => handleAction("MAYOR_SIGNED")}
                          loading={actionLoading}
                          variant="success"
                          className="w-full"
                          size="sm"
                        >
                          Mark as Signed by Mayor
                        </Button>
                        <Button
                          onClick={() => handleAction("MAYOR_HELD")}
                          loading={actionLoading}
                          variant="warning"
                          className="w-full"
                          size="sm"
                        >
                          Mark as Held by Mayor
                        </Button>
                      </>
                    )}
                    {issuance.mayorSigningStatus === "MAYOR_HELD" && (
                      <Button
                        onClick={() => handleAction("MAYOR_RETURNED")}
                        loading={actionLoading}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Mark as Returned by Mayor
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--background)]0 mb-4">
              Enter the issuance ID to process a permit, or use the issuance list to select one.
            </p>
            <Button onClick={() => router.push("/dashboard/issuance")}>
              Go to Issuance List
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
