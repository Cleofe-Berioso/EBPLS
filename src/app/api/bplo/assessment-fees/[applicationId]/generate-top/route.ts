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

  if (Object.prototype.hasOwnProperty.call(body as object, "paymentFrequency")) {
    return NextResponse.json(
      { error: "Payment frequency is applicant-selected and cannot be changed by BPLO." },
      { status: 400 }
    );
  }

  try {
    const generated = await generateTop(applicationId, session.user.id, {
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
      closurePaymentDues: body.closurePaymentDues ?? 0,
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
