import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentReferenceId: string }> }
) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentReferenceId } = await params;
  const reference = await prisma.paymentReference.findUnique({
    where: { id: paymentReferenceId },
    select: {
      proofStoragePath: true,
      proofMimeType: true,
      proofFileName: true,
    },
  });

  if (!reference) {
    return NextResponse.json({ error: "Payment reference not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(reference.proofStoragePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": reference.proofMimeType,
        "Content-Disposition": `attachment; filename="${reference.proofFileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Payment proof file not found" }, { status: 404 });
  }
}
