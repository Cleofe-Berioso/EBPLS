export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_FILE_SIZE_LABEL = "10MB";

export const DOCUMENT_UPLOAD_ERROR_MAX_SIZE =
  "File is too large. Maximum file size is 10MB per document.";
export const DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE =
  "Unsupported file type. Please upload PDF, JPG, PNG, or WEBP files.";

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const ALLOWED_DOCUMENT_MIME_TYPE_SET = new Set<string>(ALLOWED_DOCUMENT_MIME_TYPES);

export function isAllowedDocumentMimeType(mimeType: string): boolean {
  return ALLOWED_DOCUMENT_MIME_TYPE_SET.has(mimeType);
}

export function validateDocumentFileUpload(file: File): string | null {
  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return DOCUMENT_UPLOAD_ERROR_MAX_SIZE;
  }

  if (!isAllowedDocumentMimeType(file.type)) {
    return DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE;
  }

  return null;
}

export const DOCUMENT_FILE_INPUT_ACCEPT = ALLOWED_DOCUMENT_MIME_TYPES.join(",");
