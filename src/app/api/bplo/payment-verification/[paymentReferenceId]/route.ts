import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { getPaymentVerificationDetail } from "@/lib/bplo-payment-verification";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentReferenceId: string }> }
) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentReferenceId } = await params;
  const detail = await getPaymentVerificationDetail(paymentReferenceId);

  if (!detail) {
    return NextResponse.json({ error: "Payment reference not found" }, { status: 404 });
  }

  return NextResponse.json({ detail });
}
