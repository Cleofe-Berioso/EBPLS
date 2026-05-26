import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { prisma } from "@/lib/prisma";
import { createStorageSignedUrl } from "@/lib/document-storage";

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
      application: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!reference) {
    return NextResponse.json({ error: "Payment reference not found" }, { status: 404 });
  }

  const allowedStatuses = new Set([
    "APPROVED_FOR_PAYMENT",
    "PAID",
    "FOR_RELEASE",
    "RELEASED",
  ]);
  if (!allowedStatuses.has(reference.application.status)) {
    return NextResponse.json({ error: "Payment proof not available" }, { status: 403 });
  }

  try {
    const signed = await createStorageSignedUrl({
      storagePath: reference.proofStoragePath,
      mimeType: reference.proofMimeType,
      expiresIn: 60,
      download: true,
      downloadFileName: reference.proofFileName,
    });

    return NextResponse.redirect(signed.signedUrl, { status: 302 });
  } catch {
    return NextResponse.json({ error: "Payment proof file not found" }, { status: 404 });
  }
}
