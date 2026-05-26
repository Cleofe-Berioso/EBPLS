import { prisma } from "../src/lib/prisma";
import { getPaymentReferencesFromFormData } from "../src/lib/payment-reference";

type DbApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSESSED"
  | "APPROVED_FOR_PAYMENT"
  | "PAID"
  | "FOR_RELEASE"
  | "RELEASED"
  | "RETURNED_FOR_CORRECTION"
  | "REJECTED";

function parseDateOrFallback(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

async function main() {
  const apps = await prisma.businessApplication.findMany({
    select: {
      id: true,
      status: true,
      formData: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  let scanned = 0;
  let legacyRowsFound = 0;
  let inserted = 0;
  let skippedExisting = 0;

  for (const app of apps) {
    scanned += 1;

    const refs = getPaymentReferencesFromFormData(
      app.formData,
      app.id,
      app.status as DbApplicationStatus
    );

    if (!refs.length) continue;
    legacyRowsFound += refs.length;

    for (const ref of refs) {
      const existing = await prisma.paymentReference.findUnique({
        where: { transactionNumber: ref.transactionNumber },
        select: { id: true },
      });

      if (existing) {
        skippedExisting += 1;
        continue;
      }

      const submittedAt = parseDateOrFallback(ref.submittedAt, app.updatedAt ?? app.createdAt);
      const paymentDate = parseDateOrFallback(ref.submittedAt, submittedAt);

      await prisma.paymentReference.create({
        data: {
          applicationId: app.id,
          transactionNumber: ref.transactionNumber,
          amountPaid: Math.max(0, ref.amountPaid),
          paymentDate,
          proofFileName: "legacy-proof-unavailable.txt",
          proofStoragePath: "legacy://proof-unavailable",
          proofMimeType: "text/plain",
          proofSizeBytes: 0,
          status: ref.status,
          reviewerRemarks: "Backfilled from legacy formData.paymentReferences.",
          submittedAt,
          reviewedAt: ref.status === "PENDING" ? null : submittedAt,
          reviewedById: null,
        },
      });

      inserted += 1;
    }
  }

  console.log("[backfill-payment-references] complete", {
    scanned,
    legacyRowsFound,
    inserted,
    skippedExisting,
  });
}

main()
  .catch((error) => {
    console.error("[backfill-payment-references] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
