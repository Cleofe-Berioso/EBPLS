import { describe, expect, it } from "vitest";
import {
  buildDocumentMaxSizeError,
  isAllowedDocumentMimeType,
  validateDocumentFileUpload,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE,
} from "@/lib/document-upload-rules";
import {
  isAllowedProfileImageMimeType,
  validateProfileImageFile,
  PROFILE_IMAGE_ERROR_UNSUPPORTED_TYPE,
  MAX_PROFILE_IMAGE_SIZE_BYTES,
} from "@/lib/profile-image-upload-rules";

describe("WB-UPLOAD — document & profile upload rules", () => {
  it("WB-UPLOAD-01 document MIME allowlist", () => {
    expect(isAllowedDocumentMimeType("application/pdf")).toBe(true);
    expect(isAllowedDocumentMimeType("image/jpeg")).toBe(true);
    expect(isAllowedDocumentMimeType("text/plain")).toBe(false);
  });

  it("WB-UPLOAD-02 validateDocumentFileUpload size and type", () => {
    const ok = new File([new Uint8Array(10)], "a.pdf", { type: "application/pdf" });
    expect(validateDocumentFileUpload(ok)).toBeNull();

    const big = new File([new Uint8Array(MAX_DOCUMENT_FILE_SIZE_BYTES + 1)], "big.pdf", {
      type: "application/pdf",
    });
    expect(validateDocumentFileUpload(big)).toMatch(/10 MB/);

    const bad = new File([new Uint8Array(10)], "a.zip", { type: "application/zip" });
    expect(validateDocumentFileUpload(bad)).toBe(DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE);
  });

  it("WB-UPLOAD-03 buildDocumentMaxSizeError uses file name", () => {
    expect(buildDocumentMaxSizeError("tax.pdf")).toContain("tax.pdf");
    expect(buildDocumentMaxSizeError("   ")).toContain("File");
  });

  it("WB-UPLOAD-04 profile image MIME and size", () => {
    expect(isAllowedProfileImageMimeType("image/png")).toBe(true);
    expect(isAllowedProfileImageMimeType("application/pdf")).toBe(false);

    const ok = new File([new Uint8Array(10)], "p.jpg", { type: "image/jpeg" });
    expect(validateProfileImageFile(ok)).toBeNull();

    const bad = new File([new Uint8Array(10)], "p.pdf", { type: "application/pdf" });
    expect(validateProfileImageFile(bad)).toBe(PROFILE_IMAGE_ERROR_UNSUPPORTED_TYPE);

    const big = new File([new Uint8Array(MAX_PROFILE_IMAGE_SIZE_BYTES + 1)], "big.png", {
      type: "image/png",
    });
    expect(validateProfileImageFile(big)).toMatch(/5MB/);
  });
});
