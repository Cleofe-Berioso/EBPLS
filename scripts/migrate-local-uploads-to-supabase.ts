import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

const PDF_BUCKET = process.env.S3_PDF_BUCKET ?? "ebpls-pdfs";
const IMAGE_BUCKET = process.env.S3_IMAGE_BUCKET ?? "ebpls-images";

type BucketName = typeof PDF_BUCKET | typeof IMAGE_BUCKET;

type MigrationResult = {
  scanned: number;
  uploaded: number;
  skipped: number;
  missing: number;
  failed: number;
  updatedRows: number;
};

type MigrateRowInput = {
  tableName: string;
  rowId: string;
  storagePath: string;
  mimeType: string | null;
  fileName: string;
  updateStoragePath: (nextStoragePath: string) => Promise<void>;
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function resolveBucket(mimeType: string | null): BucketName | null {
  if (!mimeType) {
    return null;
  }

  if (mimeType === "application/pdf") {
    return PDF_BUCKET;
  }

  if (mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp") {
    return IMAGE_BUCKET;
  }

  return null;
}

function isLocalUploadPath(storagePath: string): boolean {
  return storagePath.includes(".uploads") || path.isAbsolute(storagePath);
}

function resolveLocalFilePath(storagePath: string): string {
  return path.isAbsolute(storagePath) ? storagePath : path.resolve(process.cwd(), storagePath);
}

function buildObjectPath(tableName: string, rowId: string, fileName: string): string {
  const safeFileName = sanitizeFileName(fileName || "upload.bin");
  return `${tableName}/${rowId}-${safeFileName}`;
}

async function objectExists(supabase: any, bucket: BucketName, objectPath: string): Promise<boolean> {
  const result = await supabase.storage.from(bucket).download(objectPath);
  return !result.error;
}

async function migrateRow(supabase: any, input: MigrateRowInput): Promise<{
  uploaded: boolean;
  skipped: boolean;
  missing: boolean;
  failed: boolean;
  updatedRow: boolean;
}> {
  if (!isLocalUploadPath(input.storagePath)) {
    return { uploaded: false, skipped: true, missing: false, failed: false, updatedRow: false };
  }

  const bucket = resolveBucket(input.mimeType);
  if (!bucket) {
    return { uploaded: false, skipped: false, missing: false, failed: true, updatedRow: false };
  }

  const localFilePath = resolveLocalFilePath(input.storagePath);
  try {
    await readFile(localFilePath);
  } catch {
    return { uploaded: false, skipped: false, missing: true, failed: false, updatedRow: false };
  }

  const targetObjectPath = buildObjectPath(input.tableName, input.rowId, input.fileName);
  const alreadyExists = await objectExists(supabase, bucket, targetObjectPath);

  if (!alreadyExists) {
    const fileBuffer = await readFile(localFilePath);
    const uploadResult = await supabase.storage.from(bucket).upload(targetObjectPath, fileBuffer, {
      contentType: input.mimeType ?? "application/octet-stream",
      upsert: false,
    });

    if (uploadResult.error) {
      return { uploaded: false, skipped: false, missing: false, failed: true, updatedRow: false };
    }
  }

  await input.updateStoragePath(targetObjectPath);
  return {
    uploaded: !alreadyExists,
    skipped: alreadyExists,
    missing: false,
    failed: false,
    updatedRow: true,
  };
}

async function migrateApplicationDocuments(supabase: any): Promise<MigrationResult> {
  const result: MigrationResult = { scanned: 0, uploaded: 0, skipped: 0, missing: 0, failed: 0, updatedRows: 0 };
  const rows = await prisma.applicationDocument.findMany({
    orderBy: { uploadedAt: "asc" },
    select: {
      id: true,
      storagePath: true,
      mimeType: true,
      fileName: true,
    },
  });

  for (const row of rows) {
    result.scanned += 1;
    const outcome = await migrateRow(supabase, {
      tableName: "application-documents",
      rowId: row.id,
      storagePath: row.storagePath,
      mimeType: row.mimeType,
      fileName: row.fileName,
      updateStoragePath: async (nextStoragePath) => {
        await prisma.applicationDocument.update({
          where: { id: row.id },
          data: { storagePath: nextStoragePath },
        });
      },
    });

    if (outcome.uploaded) result.uploaded += 1;
    if (outcome.skipped) result.skipped += 1;
    if (outcome.missing) result.missing += 1;
    if (outcome.failed) result.failed += 1;
    if (outcome.updatedRow) result.updatedRows += 1;
  }

  return result;
}

async function migratePaymentReferences(supabase: any): Promise<MigrationResult> {
  const result: MigrationResult = { scanned: 0, uploaded: 0, skipped: 0, missing: 0, failed: 0, updatedRows: 0 };
  const rows = await prisma.paymentReference.findMany({
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      proofStoragePath: true,
      proofMimeType: true,
      proofFileName: true,
    },
  });

  for (const row of rows) {
    result.scanned += 1;
    const outcome = await migrateRow(supabase, {
      tableName: "payment-proofs",
      rowId: row.id,
      storagePath: row.proofStoragePath,
      mimeType: row.proofMimeType,
      fileName: row.proofFileName,
      updateStoragePath: async (nextStoragePath) => {
        await prisma.paymentReference.update({
          where: { id: row.id },
          data: { proofStoragePath: nextStoragePath },
        });
      },
    });

    if (outcome.uploaded) result.uploaded += 1;
    if (outcome.skipped) result.skipped += 1;
    if (outcome.missing) result.missing += 1;
    if (outcome.failed) result.failed += 1;
    if (outcome.updatedRow) result.updatedRows += 1;
  }

  return result;
}

async function migrateInspectionEvidence(supabase: any): Promise<MigrationResult> {
  const result: MigrationResult = { scanned: 0, uploaded: 0, skipped: 0, missing: 0, failed: 0, updatedRows: 0 };
  const rows = await prisma.inspection.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      evidenceStoragePath: true,
      evidenceMimeType: true,
      evidenceFileName: true,
    },
  });

  for (const row of rows) {
    if (!row.evidenceStoragePath || !row.evidenceFileName) {
      continue;
    }

    result.scanned += 1;
    const outcome = await migrateRow(supabase, {
      tableName: "inspection-evidence",
      rowId: row.id,
      storagePath: row.evidenceStoragePath,
      mimeType: row.evidenceMimeType,
      fileName: row.evidenceFileName,
      updateStoragePath: async (nextStoragePath) => {
        await prisma.inspection.update({
          where: { id: row.id },
          data: { evidenceStoragePath: nextStoragePath },
        });
      },
    });

    if (outcome.uploaded) result.uploaded += 1;
    if (outcome.skipped) result.skipped += 1;
    if (outcome.missing) result.missing += 1;
    if (outcome.failed) result.failed += 1;
    if (outcome.updatedRow) result.updatedRows += 1;
  }

  return result;
}

async function main() {
  const supabase = getSupabaseClient();

  const applicationDocuments = await migrateApplicationDocuments(supabase);
  const paymentProofs = await migratePaymentReferences(supabase);
  const inspectionEvidence = await migrateInspectionEvidence(supabase);

  const totals = [applicationDocuments, paymentProofs, inspectionEvidence].reduce(
    (accumulator, current) => ({
      scanned: accumulator.scanned + current.scanned,
      uploaded: accumulator.uploaded + current.uploaded,
      skipped: accumulator.skipped + current.skipped,
      missing: accumulator.missing + current.missing,
      failed: accumulator.failed + current.failed,
      updatedRows: accumulator.updatedRows + current.updatedRows,
    }),
    { scanned: 0, uploaded: 0, skipped: 0, missing: 0, failed: 0, updatedRows: 0 }
  );

  console.log(JSON.stringify({
    applicationDocuments,
    paymentProofs,
    inspectionEvidence,
    totals,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });