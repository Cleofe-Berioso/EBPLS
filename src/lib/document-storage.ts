import "server-only";

import path from "node:path";
import { getSupabaseStorageAdminClient } from "@/lib/supabase-storage-server";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_BUCKET = process.env.S3_PDF_BUCKET ?? "ebpls-pdfs";
const IMAGE_BUCKET = process.env.S3_IMAGE_BUCKET ?? "ebpls-images";

type DocumentBucket = typeof PDF_BUCKET | typeof IMAGE_BUCKET;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function sanitizePathSegment(segment: string): string {
  return segment
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "") || "item";
}

function joinObjectPath(parts: string[]): string {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

function inferBucketFromStoragePath(storagePath: string): DocumentBucket {
  const extension = path.extname(storagePath).toLowerCase();
  if (extension === ".pdf") {
    return PDF_BUCKET;
  }

  if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
    return IMAGE_BUCKET;
  }

  throw new Error("Unable to infer storage bucket from file path");
}

export function resolveBucketByMimeType(mimeType: string): DocumentBucket {
  if (mimeType === "application/pdf") {
    return PDF_BUCKET;
  }

  if (ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    return IMAGE_BUCKET;
  }

  throw new Error("Unsupported file type. Please upload PDF, JPG, PNG, or WEBP files.");
}

export function resolveBucketByStoragePath(storagePath: string): DocumentBucket {
  return inferBucketFromStoragePath(storagePath);
}

function buildApplicationObjectPath(params: {
  applicationId: string;
  documentType: string;
  fileName: string;
}): string {
  const applicationId = sanitizePathSegment(params.applicationId);
  const documentType = sanitizePathSegment(params.documentType);
  const safeFileName = sanitizeFileName(params.fileName || "upload.bin");
  const fileName = `${Date.now()}-${safeFileName}`;

  return joinObjectPath(["applications", applicationId, documentType, fileName]);
}

export async function uploadDocumentFile(params: {
  file: File;
  objectPath?: string;
  objectPrefix?: string;
}) {
  const { file, objectPrefix, objectPath } = params;

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Please upload PDF, JPG, PNG, or WEBP files.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds 10 MB limit.");
  }

  const bucket = resolveBucketByMimeType(file.type);
  const safeFileName = sanitizeFileName(file.name || "upload.bin");
  const storagePath =
    objectPath ??
    joinObjectPath([
      objectPrefix ? sanitizePathSegment(objectPrefix) : "documents",
      `${Date.now()}-${safeFileName}`,
    ]);

  const supabase = getSupabaseStorageAdminClient();
  const uploadResult = await supabase.storage.from(bucket).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message);
  }

  return {
    fileName: safeFileName,
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath,
    bucket,
  };
}

export async function uploadApplicationFile(params: {
  applicationId: string;
  documentType: string;
  file: File;
}) {
  const objectPath = buildApplicationObjectPath({
    applicationId: params.applicationId,
    documentType: params.documentType,
    fileName: params.file.name,
  });

  return uploadDocumentFile({
    file: params.file,
    objectPath,
  });
}

export async function createStorageSignedUrl(params: {
  storagePath: string;
  mimeType: string;
  expiresIn?: number;
  downloadFileName?: string;
  download?: boolean;
}) {
  const bucket = resolveBucketByMimeType(params.mimeType);
  const supabase = getSupabaseStorageAdminClient();
  const result = await supabase.storage.from(bucket).createSignedUrl(params.storagePath, params.expiresIn ?? 60, {
    download: params.download ? params.downloadFileName || true : false,
  });

  if (result.error || !result.data?.signedUrl) {
    throw new Error(result.error?.message ?? "Unable to create signed URL");
  }

  return {
    bucket,
    signedUrl: result.data.signedUrl,
  };
}

export async function deleteStorageObject(params: {
  storagePath: string;
  mimeType?: string;
}) {
  const bucket = params.mimeType ? resolveBucketByMimeType(params.mimeType) : inferBucketFromStoragePath(params.storagePath);
  const supabase = getSupabaseStorageAdminClient();
  const result = await supabase.storage.from(bucket).remove([params.storagePath]);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { bucket };
}

export async function storeApplicantDocument(
  file: File,
  options?: {
    applicationId?: string;
    documentType?: string;
    objectPrefix?: string;
  }
) {
  if (options?.applicationId && options.documentType) {
    return uploadApplicationFile({
      file,
      applicationId: options.applicationId,
      documentType: options.documentType,
    });
  }

  return uploadDocumentFile({ file, objectPrefix: options?.objectPrefix });
}

export async function removeApplicantDocument(storagePath: string, mimeType?: string) {
  try {
    await deleteStorageObject({ storagePath, mimeType });
  } catch {
    // Missing files should not break document record cleanup.
  }
}

export const getDocumentSignedUrl = createStorageSignedUrl;
export const deleteDocumentFile = deleteStorageObject;
