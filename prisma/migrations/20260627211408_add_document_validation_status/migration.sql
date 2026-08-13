/*
  Warnings:

  - You are about to drop the column `profileImageFileName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileImageSize` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profileImageUpdatedAt` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentValidationStatus" AS ENUM ('PENDING_REVIEW', 'VALID', 'INVALID', 'INCOMPLETE', 'REQUIRES_RESUBMISSION');

-- AlterTable
ALTER TABLE "ApplicationDocument" ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validatedById" TEXT,
ADD COLUMN     "validationRemarks" TEXT,
ADD COLUMN     "validationStatus" "DocumentValidationStatus" NOT NULL DEFAULT 'PENDING_REVIEW';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileImageFileName",
DROP COLUMN "profileImageSize",
DROP COLUMN "profileImageUpdatedAt";

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
