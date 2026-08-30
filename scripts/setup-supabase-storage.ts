/**
 * Ensure Supabase Storage buckets exist for EBPLS uploads.
 * Run: npm run db:setup:storage
 */
import "./ebpls-env";
import { createClient } from "@supabase/supabase-js";

const PDF_BUCKET = process.env.S3_PDF_BUCKET ?? "ebpls-pdfs";
const IMAGE_BUCKET = process.env.S3_IMAGE_BUCKET ?? "ebpls-images";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const [id, mimeTypes] of [
    [PDF_BUCKET, ["application/pdf"]] as const,
    [IMAGE_BUCKET, ["image/jpeg", "image/png", "image/webp"]] as const,
  ]) {
    const { data: existing } = await supabase.storage.getBucket(id);
    if (existing) {
      console.log(`✓ Bucket exists: ${id}`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(id, {
      public: false,
      fileSizeLimit: id === PDF_BUCKET ? 52_428_800 : 10_485_760,
      allowedMimeTypes: [...mimeTypes],
    });

    if (error) {
      throw new Error(`Failed to create bucket ${id}: ${error.message}`);
    }
    console.log(`✓ Created bucket: ${id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
