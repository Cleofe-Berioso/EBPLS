import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { listPaymentVerificationEntries } from "@/lib/bplo-payment-verification";

export async function GET() {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listPaymentVerificationEntries();
  return NextResponse.json(rows);
}
