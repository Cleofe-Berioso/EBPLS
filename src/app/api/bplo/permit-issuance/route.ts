import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { listPermitIssuanceEntries } from "@/lib/bplo-permit-issuance";

export async function GET() {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await listPermitIssuanceEntries();
  return NextResponse.json(result);
}
