import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { Upload, FileText } from "lucide-react";
import { VerifyDocumentActions } from "@/components/dashboard/verify-document-actions";

export const metadata = { title: "Verify Documents" };

export default async function VerifyDocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "BPLO_OFFICE") redirect("/dashboard");

  const documents = await prisma.document.findMany({
    where: { status: { in: ["UPLOADED", "PENDING_VERIFICATION"] } },
    orderBy: { createdAt: "asc" },
    include: {
      application: {
        select: { applicationNumber: true, businessName: true },
      },
      uploader: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Verify Documents</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Review and verify uploaded documents from applicants
        </p>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<Upload className="h-8 w-8 text-[var(--text-muted)]" />}
          title="No documents to verify"
          description="All documents have been verified. Check back later."
        />
      ) : (
        <div className="space-y-4">          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-7 w-7 flex-shrink-0 text-[var(--text-muted)]" />
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">{doc.originalName}</p>
                      <p className="text-sm text-[var(--background)]0">
                        {doc.documentType.replace(/_/g, " ")} · v{doc.version} · {doc.application.applicationNumber}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Uploaded by {doc.uploader.firstName} {doc.uploader.lastName} on{" "}
                        {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3 pl-10 sm:pl-0">
                    <StatusBadge status={doc.status} />
                    <VerifyDocumentActions documentId={doc.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
