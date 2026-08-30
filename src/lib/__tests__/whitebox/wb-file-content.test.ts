import { describe, expect, it } from "vitest";
import { validateDocumentFileContent } from "@/lib/file-content-validation";

describe("WB-FILE — magic-byte content validation", () => {
  it("WB-FILE-01 accepts real PDF magic bytes with matching MIME", () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    expect(validateDocumentFileContent(pdf, "application/pdf")).toBeNull();
  });

  it("WB-FILE-02 accepts JPEG magic bytes", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(validateDocumentFileContent(jpeg, "image/jpeg")).toBeNull();
  });

  it("WB-FILE-03 accepts PNG magic bytes", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(validateDocumentFileContent(png, "image/png")).toBeNull();
  });

  it("WB-FILE-04 rejects MIME/content mismatch (fake PDF)", () => {
    const fake = new TextEncoder().encode("not-a-pdf");
    expect(validateDocumentFileContent(fake, "application/pdf")).toBeTruthy();
  });

  it("WB-FILE-05 rejects disallowed declared MIME", () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    expect(validateDocumentFileContent(pdf, "application/zip")).toBeTruthy();
  });

  it("WB-FILE-06 rejects JPEG bytes declared as PDF", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    expect(validateDocumentFileContent(jpeg, "application/pdf")).toBeTruthy();
  });
});
