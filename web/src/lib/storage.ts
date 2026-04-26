/**
 * S3/MinIO Storage Module
 * Handles file uploads, presigned URLs, and magic bytes validation.
 * Local filesystem storage is available only as an explicit development mock mode.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Local Filesystem Fallback
// ============================================================================

const USE_LOCAL_STORAGE =
  process.env.STORAGE_DRIVER === 'local' ||
  (!process.env.S3_ENDPOINT && process.env.NODE_ENV === 'development');

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const LOCAL_FILE_ROUTE_PREFIX = '/api/files';
const STORAGE_UNAVAILABLE_MESSAGE =
  'Storage service unavailable. Start MinIO/S3 or set STORAGE_DRIVER=local for intentional local development uploads.';
const globalForStorage = globalThis as typeof globalThis & {
  __ebplsStorageWarningLogged?: boolean;
  __ebplsClamWarningLogged?: boolean;
};
let storageWarningLogged = globalForStorage.__ebplsStorageWarningLogged ?? false;
let clamWarningLogged = globalForStorage.__ebplsClamWarningLogged ?? false;

function syncStorageWarnings() {
  globalForStorage.__ebplsStorageWarningLogged = storageWarningLogged;
  globalForStorage.__ebplsClamWarningLogged = clamWarningLogged;
}

function warnStorageUnavailableOnce(reason?: string) {
  if (storageWarningLogged) return;
  const suffix = reason ? ` (${reason})` : "";
  console.warn(`[Storage] ${STORAGE_UNAVAILABLE_MESSAGE}${suffix}`);
  storageWarningLogged = true;
  syncStorageWarnings();
}

function normalizeStorageError(error: unknown): string {
  const detail = error instanceof Error ? error.message : 'Storage request failed';
  if (!USE_LOCAL_STORAGE && process.env.NODE_ENV === 'development') {
    warnStorageUnavailableOnce(detail);
    return STORAGE_UNAVAILABLE_MESSAGE;
  }
  return detail;
}

function ensureLocalDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function localUpload(options: UploadOptions): Promise<UploadResult> {
  try {
    const fullPath = path.join(LOCAL_UPLOAD_DIR, options.key);
    ensureLocalDir(fullPath);
    fs.writeFileSync(fullPath, options.body);
    return { success: true, key: options.key, url: `${LOCAL_FILE_ROUTE_PREFIX}/${options.key}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Local upload failed' };
  }
}

function localDelete(key: string): boolean {
  try {
    const fullPath = path.join(LOCAL_UPLOAD_DIR, key);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    return true;
  } catch { return false; }
}

function localExists(key: string): boolean {
  return fs.existsSync(path.join(LOCAL_UPLOAD_DIR, key));
}

function localReadStream(key: string): fs.ReadStream {
  return fs.createReadStream(path.join(LOCAL_UPLOAD_DIR, key));
}

// ============================================================================
// S3 Client Configuration
// ============================================================================

// In production, S3 credentials must be explicitly configured.
// Fallback to dev defaults only when using local storage driver.
const isProduction = process.env.NODE_ENV === 'production';
const s3AccessKey = process.env.S3_ACCESS_KEY;
const s3SecretKey = process.env.S3_SECRET_KEY;

if (isProduction && !USE_LOCAL_STORAGE && (!s3AccessKey || !s3SecretKey)) {
  throw new Error(
    'S3_ACCESS_KEY and S3_SECRET_KEY must be set in production. ' +
    'Set STORAGE_DRIVER=local to use local filesystem storage instead.'
  );
}

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ap-southeast-1',
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: s3AccessKey || 'minioadmin',
    secretAccessKey: s3SecretKey || 'minioadmin',
  },
});

export const PDF_BUCKET = process.env.S3_PDF_BUCKET || 'ebpls-pdfs';
export const IMAGE_BUCKET = process.env.S3_IMAGE_BUCKET || 'ebpls-images';

export function getBucketForContentType(contentType?: string): string {
  if (contentType === 'application/pdf') return PDF_BUCKET;
  if (
    contentType === 'image/jpeg' ||
    contentType === 'image/png' ||
    contentType === 'image/webp'
  ) {
    return IMAGE_BUCKET;
  }
  return PDF_BUCKET;
}

// ============================================================================
// Magic Bytes Validation
// ============================================================================

const MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

export function validateMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  const signatures = MAGIC_BYTES[declaredMimeType];
  if (!signatures) return false;

  return signatures.some((sig) =>
    sig.every((byte, index) => buffer[index] === byte)
  );
}

// ============================================================================
// File Upload
// ============================================================================

export interface UploadOptions {
  key: string;
  body: Buffer;
  contentType: string;
  bucket?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  try {
    // Validate magic bytes
    if (!validateMagicBytes(options.body, options.contentType)) {
      return {
        success: false,
        error: 'File content does not match declared MIME type. Possible file spoofing detected.',
      };
    }

    // Use local filesystem if S3 not configured
    if (USE_LOCAL_STORAGE) return localUpload(options);

    const bucket = options.bucket || getBucketForContentType(options.contentType);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType,
        Metadata: options.metadata,
      })
    );

    return {
      success: true,
      key: options.key,
      url: `${process.env.S3_ENDPOINT}/${bucket}/${options.key}`,
    };
  } catch (error) {
    return {
      success: false,
      error: normalizeStorageError(error),
    };
  }
}

// ============================================================================
// Presigned URL Generation
// ============================================================================

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600,
  contentType?: string,
  bucketOverride?: string
): Promise<string> {
  // Local storage: return a direct API route URL
  if (USE_LOCAL_STORAGE) {
    return `${LOCAL_FILE_ROUTE_PREFIX}/${key}`;
  }

  const bucket = bucketOverride || getBucketForContentType(contentType);
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    throw new Error(normalizeStorageError(error));
  }
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 900
): Promise<string> {
  try {
    const bucket = getBucketForContentType(contentType);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    throw new Error(normalizeStorageError(error));
  }
}

// ============================================================================
// File Operations
// ============================================================================

export async function deleteFile(
  key: string,
  contentType?: string,
  bucketOverride?: string
): Promise<boolean> {
  if (USE_LOCAL_STORAGE) return localDelete(key);
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketOverride || getBucketForContentType(contentType),
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function fileExists(
  key: string,
  contentType?: string,
  bucketOverride?: string
): Promise<boolean> {
  if (USE_LOCAL_STORAGE) return localExists(key);
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketOverride || getBucketForContentType(contentType),
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function getFileStream(
  key: string,
  contentType?: string,
  bucketOverride?: string
) {
  if (USE_LOCAL_STORAGE) return localReadStream(key);
  try {
    const command = new GetObjectCommand({
      Bucket: bucketOverride || getBucketForContentType(contentType),
      Key: key,
    });

    const response = await s3Client.send(command);
    return response.Body;
  } catch (error) {
    throw new Error(normalizeStorageError(error));
  }
}

// ============================================================================
// ClamAV Virus Scanning (optional, via REST API)
// ============================================================================

export async function scanForVirus(buffer: Buffer): Promise<{ clean: boolean; threat?: string }> {
  const CLAMAV_URL = process.env.CLAMAV_API_URL;

  if (!CLAMAV_URL) {
    // ClamAV not configured — skip scanning in development
    if (process.env.NODE_ENV === 'development') {
      if (!clamWarningLogged) {
        console.warn('[Storage] ClamAV not configured; virus scan skipped in development.');
        clamWarningLogged = true;
        syncStorageWarnings();
      }
      return { clean: true };
    }
    // In production, log warning but allow (operator should configure ClamAV)
    if (!clamWarningLogged) {
      console.warn('[Storage] ClamAV not configured; virus scanning is disabled.');
      clamWarningLogged = true;
      syncStorageWarnings();
    }
    return { clean: true };
  }
  try {
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(buffer)]));

    const response = await fetch(`${CLAMAV_URL}/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('ClamAV scan failed');
    }

    const result = await response.json();
    return {
      clean: result.status === 'clean',
      threat: result.status !== 'clean' ? result.virus : undefined,
    };
  } catch (error) {
    console.error('Virus scan error:', error);
    // Fail open in dev, fail closed in production
    if (process.env.NODE_ENV === 'development') return { clean: true };
    return { clean: false, threat: 'Scan service unavailable' };
  }
}

// ============================================================================
// Storage Path Helpers
// ============================================================================

export function generateStoragePath(
  applicationId: string,
  fileId: string,
  extension: string
): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `documents/${year}/${month}/${applicationId}/${fileId}.${extension}`;
}

export function generatePermitStoragePath(permitId: string): string {
  const date = new Date();
  const year = date.getFullYear();
  return `permits/${year}/${permitId}.pdf`;
}
