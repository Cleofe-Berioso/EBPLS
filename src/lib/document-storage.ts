import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const UPLOAD_DIR = path.join(process.cwd(), ".uploads", "applicant-documents");

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function storeApplicantDocument(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Please upload PDF, JPG, PNG, or WEBP files.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds 10 MB limit.");
  }

  const extension = path.extname(file.name) || ".bin";
  const diskName = `${Date.now()}-${randomUUID()}${extension}`;
  const storagePath = path.join(UPLOAD_DIR, diskName);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, buffer);

  return {
    fileName: sanitizeFileName(file.name),
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath,
  };
}

export async function removeApplicantDocument(storagePath: string) {
  try {
    await unlink(storagePath);
  } catch {
    // Missing files should not break document record cleanup.
  }
}
