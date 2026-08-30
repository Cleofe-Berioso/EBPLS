import { NextResponse } from "next/server";
import type { DocumentValidationStatus } from "@prisma/client";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { requireBploSession } from "@/lib/bplo-api";
import { updateBploDocumentValidation } from "@/lib/bplo-applications";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

const VALID_STATUSES: DocumentValidationStatus[] = [
  "PENDING_REVIEW",
  "VALID",
  "INVALID",
  "INCOMPLETE",
  "REQUIRES_RESUBMISSION",
];

export async function PATCH(req: Request, context: RouteContext) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const body = (await req.json()) as { status?: DocumentValidationStatus; remarks?: string };

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid validation status" }, { status: 400 });
    }

    const document = await updateBploDocumentValidation(applicationId, documentId, session.user.id, {
      status: body.status,
      remarks: body.remarks,
    });

    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status =
      message === "Application not found" || message === "Document not found"
        ? 404
        : message === "Application is not available for BPLO review" ||
            message === "Document does not belong to the requested application"
          ? 403
          : message === "Remarks are required for this validation status"
            ? 400
            : 400;
    return NextResponse.json(
      { error: safeApiErrorMessage(error, "Unable to update document validation") },
      { status }
    );
  }
}
