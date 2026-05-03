import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { generateTop } from "@/lib/bplo-assessment";
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

  const validFrequencies = ["ANNUAL", "BI_ANNUAL", "QUARTERLY"];
  if (!body.paymentFrequency || !validFrequencies.includes(body.paymentFrequency)) {
    return NextResponse.json({ error: "paymentFrequency is required" }, { status: 400 });
  }

  try {
    const generated = await generateTop(applicationId, session.user.id, {
      paymentFrequency: body.paymentFrequency,
      mayorsPermitFee: body.mayorsPermitFee ?? 0,
      regulatoryFees: body.regulatoryFees ?? 0,
      additionalCharges: body.additionalCharges ?? 0,
      penalties: body.penalties ?? 0,
      surcharge: body.surcharge ?? 0,
      interest: body.interest ?? 0,
      closureCertificateFee: body.closureCertificateFee ?? 0,
      arrears: body.arrears ?? 0,
      otherCharges: body.otherCharges ?? 0,
      remarks: body.remarks,
    });
    return NextResponse.json({ generated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate Tax Order of Payment";
    const status =
      message === "Application not found"
        ? 404
        : message.includes("ASSESSED")
          ? 422
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
