import { NextResponse } from "next/server";
import { getApplicantTopSummary, submitApplicantPaymentReference } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";

export async function GET() {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getApplicantTopSummary(session.user.id);
  return NextResponse.json({ summary });
}

export async function POST(req: Request) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { applicationId?: string; transactionNumber?: string; amountPaid?: number };
  try {
    payload = (await req.json()) as {
      applicationId?: string;
      transactionNumber?: string;
      amountPaid?: number;
    };
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!payload.applicationId || !payload.transactionNumber?.trim()) {
    return NextResponse.json(
      { error: "applicationId and transactionNumber are required" },
      { status: 400 }
    );
  }

  const amountPaid =
    typeof payload.amountPaid === "number" && payload.amountPaid > 0 ? payload.amountPaid : 0;

  try {
    const result = await submitApplicantPaymentReference(
      session.user.id,
      payload.applicationId,
      payload.transactionNumber.trim(),
      amountPaid
    );

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit payment reference";
    const status = message === "Application not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
