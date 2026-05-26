-- Additive profile and split-name fields for User compatibility.
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "middleName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN "suffix" TEXT;
ALTER TABLE "User" ADD COLUMN "profileImageStoragePath" TEXT;
ALTER TABLE "User" ADD COLUMN "profileImageBucket" TEXT;
ALTER TABLE "User" ADD COLUMN "profileImageMimeType" TEXT;
ALTER TABLE "User" ADD COLUMN "profileImageSizeBytes" INTEGER;
ALTER TABLE "User" ADD COLUMN "profileImageUploadedAt" TIMESTAMP(3);

-- Additive owner split-name fields for BusinessRecord compatibility.
ALTER TABLE "BusinessRecord" ADD COLUMN "ownerFirstName" TEXT;
ALTER TABLE "BusinessRecord" ADD COLUMN "ownerMiddleName" TEXT;
ALTER TABLE "BusinessRecord" ADD COLUMN "ownerLastName" TEXT;
ALTER TABLE "BusinessRecord" ADD COLUMN "ownerSuffix" TEXT;
