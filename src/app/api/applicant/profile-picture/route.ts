import { NextResponse } from "next/server";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";
import { prisma } from "@/lib/prisma";
import {
  PROFILE_IMAGE_ERROR_MAX_SIZE,
  PROFILE_IMAGE_ERROR_UNSUPPORTED_TYPE,
  validateProfileImageFile,
} from "@/lib/profile-image-upload-rules";
import {
  createStorageSignedUrlByPath,
  removeApplicantDocument,
  uploadApplicantProfileImage,
} from "@/lib/document-storage";

const PROFILE_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 30;

async function resolveSignedProfileImageUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath) return null;

  try {
    const signed = await createStorageSignedUrlByPath({
      storagePath,
      expiresIn: PROFILE_IMAGE_SIGNED_URL_TTL_SECONDS,
    });
    return signed.signedUrl;
  } catch {
    return null;
  }
}

export async function GET() {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const user = await prisma.user.findUnique({
    where: { id: authContext.applicantId },
    select: {
      id: true,
      profileImageStoragePath: true,
      profileImageBucket: true,
      profileImageMimeType: true,
      profileImageSizeBytes: true,
      profileImageUploadedAt: true,
    },
  });

  const signedUrl = await resolveSignedProfileImageUrl(user?.profileImageStoragePath ?? null);

  return NextResponse.json({
    profileImage: {
      hasProfileImage: Boolean(user?.profileImageStoragePath),
      storagePath: user?.profileImageStoragePath ?? null,
      bucket: user?.profileImageBucket ?? null,
      mimeType: user?.profileImageMimeType ?? null,
      sizeBytes: user?.profileImageSizeBytes ?? null,
      uploadedAt: user?.profileImageUploadedAt?.toISOString() ?? null,
      signedUrl,
    },
  });
}

export async function POST(req: Request) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const formData = await req.formData();
  const fileValue = formData.get("image");

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: "Profile image is required." }, { status: 400 });
  }

  const validationError = validateProfileImageFile(fileValue);
  if (validationError) {
    const status =
      validationError === PROFILE_IMAGE_ERROR_MAX_SIZE ||
      validationError === PROFILE_IMAGE_ERROR_UNSUPPORTED_TYPE
        ? 400
        : 422;
    return NextResponse.json({ error: validationError }, { status });
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: authContext.applicantId },
    select: {
      profileImageStoragePath: true,
      profileImageMimeType: true,
    },
  });

  const uploaded = await uploadApplicantProfileImage({
    applicantId: authContext.applicantId,
    file: fileValue,
  });

  try {
    const updated = await prisma.user.update({
      where: { id: authContext.applicantId },
      data: {
        profileImageStoragePath: uploaded.storagePath,
        profileImageBucket: uploaded.bucket,
        profileImageMimeType: uploaded.mimeType,
        profileImageSizeBytes: uploaded.sizeBytes,
        profileImageUploadedAt: new Date(),
      },
      select: {
        profileImageStoragePath: true,
        profileImageBucket: true,
        profileImageMimeType: true,
        profileImageSizeBytes: true,
        profileImageUploadedAt: true,
      },
    });

    const signedUrl = await resolveSignedProfileImageUrl(updated.profileImageStoragePath ?? null);

    if (
      existingUser?.profileImageStoragePath &&
      existingUser.profileImageStoragePath !== updated.profileImageStoragePath
    ) {
      await removeApplicantDocument(
        existingUser.profileImageStoragePath,
        existingUser.profileImageMimeType ?? undefined
      );
    }

    return NextResponse.json({
      profileImage: {
        hasProfileImage: Boolean(updated.profileImageStoragePath),
        storagePath: updated.profileImageStoragePath,
        bucket: updated.profileImageBucket,
        mimeType: updated.profileImageMimeType,
        sizeBytes: updated.profileImageSizeBytes,
        uploadedAt: updated.profileImageUploadedAt?.toISOString() ?? null,
        signedUrl,
      },
    });
  } catch (error) {
    await removeApplicantDocument(uploaded.storagePath, uploaded.mimeType);
    const message = error instanceof Error ? error.message : "Unable to save profile image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
