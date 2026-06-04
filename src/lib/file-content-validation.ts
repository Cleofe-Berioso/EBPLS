import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE,
  isAllowedDocumentMimeType,
} from "@/lib/document-upload-rules";

const ALLOWED_DETECTED_MIMES = new Set<string>(ALLOWED_DOCUMENT_MIME_TYPES);

function detectMimeFromMagicBytes(bytes: Uint8Array): string | null {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Verifies file bytes match an allowed document MIME and the declared client type.
 */
export function validateDocumentFileContent(
  bytes: Uint8Array,
  declaredMime: string
): string | null {
  if (!isAllowedDocumentMimeType(declaredMime)) {
    return DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE;
  }

  const detected = detectMimeFromMagicBytes(bytes);
  if (!detected || !ALLOWED_DETECTED_MIMES.has(detected)) {
    return DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE;
  }

  if (detected !== declaredMime) {
    return DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE;
  }

  return null;
}
