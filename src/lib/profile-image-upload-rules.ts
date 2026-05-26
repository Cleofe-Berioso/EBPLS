export const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const PROFILE_IMAGE_ERROR_MAX_SIZE =
  "Profile image is too large. Maximum file size is 5MB.";

export const PROFILE_IMAGE_ERROR_UNSUPPORTED_TYPE =
  "Unsupported image type. Please upload JPG, PNG, or WEBP.";

export const ALLOWED_PROFILE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const ALLOWED_PROFILE_IMAGE_MIME_TYPE_SET = new Set<string>(ALLOWED_PROFILE_IMAGE_MIME_TYPES);

export function isAllowedProfileImageMimeType(mimeType: string): boolean {
  return ALLOWED_PROFILE_IMAGE_MIME_TYPE_SET.has(mimeType);
}

export function validateProfileImageFile(file: File): string | null {
  if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return PROFILE_IMAGE_ERROR_MAX_SIZE;
  }

  if (!isAllowedProfileImageMimeType(file.type)) {
    return PROFILE_IMAGE_ERROR_UNSUPPORTED_TYPE;
  }

  return null;
}

export const PROFILE_IMAGE_FILE_INPUT_ACCEPT = ALLOWED_PROFILE_IMAGE_MIME_TYPES.join(",");
