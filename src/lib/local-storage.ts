import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

function getUploadRoot(): string {
  return process.env.LOCAL_UPLOAD_ROOT ?? ".uploads";
}

/**
 * Ensures the upload root directory exists. Safe to call on every request.
 */
export async function ensureUploadRoot(): Promise<void> {
  const root = path.resolve(process.cwd(), getUploadRoot());
  await fs.mkdir(root, { recursive: true });
}

/**
 * Resolves a storagePath relative to the upload root, with path-traversal protection.
 */
export function resolveLocalFilePath(storagePath: string): string {
  const root = path.resolve(process.cwd(), getUploadRoot());
  const resolved = path.resolve(root, storagePath);

  // Prevent directory traversal outside the upload root.
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("Invalid storage path: directory traversal detected");
  }

  return resolved;
}

export async function localWriteFile(storagePath: string, file: File): Promise<void> {
  const dest = resolveLocalFilePath(storagePath);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);
}

export async function localDeleteFile(storagePath: string): Promise<void> {
  const dest = resolveLocalFilePath(storagePath);
  try {
    await fs.unlink(dest);
  } catch {
    // File may not exist — silently ignore.
  }
}

export async function localReadFile(storagePath: string): Promise<Buffer> {
  const dest = resolveLocalFilePath(storagePath);
  return fs.readFile(dest);
}
