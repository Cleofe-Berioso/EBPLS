import { describe, expect, it } from "vitest";
import {
  getBucketForContentType,
  IMAGE_BUCKET,
  PDF_BUCKET,
  validateMagicBytes,
} from "@/lib/storage";

describe("storage upload validation", () => {
  it("routes PDFs and images to separate private buckets", () => {
    expect(getBucketForContentType("application/pdf")).toBe(PDF_BUCKET);
    expect(getBucketForContentType("image/jpeg")).toBe(IMAGE_BUCKET);
    expect(getBucketForContentType("image/png")).toBe(IMAGE_BUCKET);
    expect(getBucketForContentType("image/webp")).toBe(IMAGE_BUCKET);
  });

  it("accepts valid PDF magic bytes", () => {
    expect(validateMagicBytes(Buffer.from([0x25, 0x50, 0x44, 0x46]), "application/pdf")).toBe(true);
  });

  it("rejects mismatched MIME declarations", () => {
    expect(validateMagicBytes(Buffer.from([0x25, 0x50, 0x44, 0x46]), "image/png")).toBe(false);
  });
});
