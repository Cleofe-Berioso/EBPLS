import { createStorageSignedUrlByPath } from "@/lib/document-storage";

const BROWSER_IMAGE_PATH_PREFIXES = ["/uploads/", "/images/", "/api/uploads/"];

function normalizeValue(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isBrowserImagePath(value: string): boolean {
  return BROWSER_IMAGE_PATH_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export async function resolveApplicantProfileImageUrl(
  profileImageValue: string | null | undefined,
  options?: { expiresInSeconds?: number }
): Promise<string | null> {
  const normalizedValue = normalizeValue(profileImageValue);
  if (!normalizedValue) return null;

  if (isHttpUrl(normalizedValue) || isBrowserImagePath(normalizedValue)) {
    return normalizedValue;
  }

  const storagePath = normalizedValue.replace(/^\/+/, "");
  if (!storagePath) return null;

  try {
    const signed = await createStorageSignedUrlByPath({
      storagePath,
      expiresIn: options?.expiresInSeconds,
    });
    return signed.signedUrl;
  } catch {
    return null;
  }
}