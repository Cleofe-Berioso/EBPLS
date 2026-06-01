import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { requireBploSession } from "@/lib/bplo-api";
import { saveAssessmentDraft } from "@/lib/bplo-assessment";
import type { AssessmentInput } from "@/lib/bplo-assessment";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;

  let body: Partial<AssessmentInput>;
  try {
    body = (await req.json()) as Partial<AssessmentInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (Object.prototype.hasOwnProperty.call(body as object, "paymentFrequency")) {
    return NextResponse.json(
      { error: "Payment frequency is applicant-selected and cannot be changed by BPLO." },
      { status: 400 }
    );
  }

  try {
    const saved = await saveAssessmentDraft(applicationId, session.user.id, {
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
      closurePaymentDues: body.closurePaymentDues,
      remarks: body.remarks,
    });
    return NextResponse.json({ saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status =
      message === "Application not found"
        ? 404
        : message.includes("can only be") || message.includes("Current status")
          ? 422
          : 400;
    return NextResponse.json({ error: safeApiErrorMessage(error, "Unable to save assessment draft") }, { status });
  }
}
