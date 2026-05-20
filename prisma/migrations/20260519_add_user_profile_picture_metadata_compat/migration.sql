-- Additive profile picture metadata fields for User compatibility.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImageStoragePath" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImageFileName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImageBucket" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImageMimeType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImageSize" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImageSizeBytes" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImageUpdatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileImageUploadedAt" TIMESTAMP(3);
