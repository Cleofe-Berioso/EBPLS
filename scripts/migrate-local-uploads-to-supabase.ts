/**
 * Upload all files from LOCAL_UPLOAD_ROOT (.uploads) to Supabase Storage.
 * Preserves object paths (e.g. applications/{id}/DocType/file.pdf) — no DB updates needed.
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   S3_PDF_BUCKET / S3_IMAGE_BUCKET (defaults: ebpls-pdfs, ebpls-images)
 *
 * Run: npm run db:migrate:storage
 */
import "./ebpls-env";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PDF_BUCKET = process.env.S3_PDF_BUCKET ?? "ebpls-pdfs";
const IMAGE_BUCKET = process.env.S3_IMAGE_BUCKET ?? "ebpls-images";
const UPLOAD_ROOT = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_ROOT ?? ".uploads");

function resolveLocalFilePath(storagePath: string): string {
  const resolved = path.resolve(UPLOAD_ROOT, storagePath);
  if (!resolved.startsWith(UPLOAD_ROOT + path.sep) && resolved !== UPLOAD_ROOT) {
    throw new Error("Invalid storage path");
  }
  return resolved;
}

async function ensureUploadRoot(): Promise<void> {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
}

type BucketName = typeof PDF_BUCKET | typeof IMAGE_BUCKET;

type Stats = {
  scanned: number;
  uploaded: number;
  skipped: number;
  failed: number;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required. Get it from Supabase Dashboard → Project Settings → API → service_role"
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function bucketForFile(relativePath: string): BucketName | null {
  const ext = path.extname(relativePath).toLowerCase();
  if (ext === ".pdf") return PDF_BUCKET;
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return IMAGE_BUCKET;
  return null;
}

function mimeForExt(relativePath: string): string {
  const ext = path.extname(relativePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function walkFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full, base)));
    } else if (entry.isFile()) {
      files.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return files;
}

async function objectExists(
  supabase: ReturnType<typeof getSupabase>,
  bucket: BucketName,
  objectPath: string
): Promise<boolean> {
  const folder = path.dirname(objectPath).split(path.sep).join("/");
  const name = path.basename(objectPath);
  const { data, error } = await supabase.storage.from(bucket).list(folder === "." ? "" : folder, {
    search: name,
  });
  if (error) return false;
  return (data ?? []).some((item) => item.name === name);
}

async function main() {
  await ensureUploadRoot();
  const supabase = getSupabase();
  const stats: Stats = { scanned: 0, uploaded: 0, skipped: 0, failed: 0 };

  let relativePaths: string[];
  try {
    relativePaths = await walkFiles(UPLOAD_ROOT);
  } catch {
    console.log("No local upload folder found — nothing to migrate.");
    return;
  }

  console.log(`Scanning ${UPLOAD_ROOT} (${relativePaths.length} files)...`);

  for (const storagePath of relativePaths) {
    stats.scanned += 1;
    const bucket = bucketForFile(storagePath);
    if (!bucket) {
      console.warn(`  skip (unknown type): ${storagePath}`);
      stats.skipped += 1;
      continue;
    }

    if (await objectExists(supabase, bucket, storagePath)) {
      stats.skipped += 1;
      continue;
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(resolveLocalFilePath(storagePath));
    } catch {
      console.warn(`  missing local file: ${storagePath}`);
      stats.failed += 1;
      continue;
    }

    const { error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
      contentType: mimeForExt(storagePath),
      upsert: false,
    });

    if (error) {
      console.error(`  failed: ${storagePath} — ${error.message}`);
      stats.failed += 1;
    } else {
      stats.uploaded += 1;
      if (stats.uploaded % 25 === 0) {
        console.log(`  uploaded ${stats.uploaded}...`);
      }
    }
  }

  console.log("\nMigration complete:");
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
