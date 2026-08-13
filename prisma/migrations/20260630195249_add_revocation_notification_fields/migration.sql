-- CreateEnum
CREATE TYPE "RevocationNotificationEventType" AS ENUM ('REVOCATION_REVIEW_ENTERED', 'REVOCATION_APPROVED', 'REVOCATION_DENIED');

-- CreateEnum
CREATE TYPE "RevocationNotificationDeliveryStatus" AS ENUM ('SKIPPED', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "revocationRecommendationRemarks" TEXT;

-- CreateTable
CREATE TABLE "RevocationNotificationLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "applicantId" TEXT,
    "inspectionId" TEXT,
    "eventType" "RevocationNotificationEventType" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" "RevocationNotificationDeliveryStatus" NOT NULL,
    "subject" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "skipReason" TEXT,
    "providerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevocationNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RevocationNotificationLog_status_createdAt_idx" ON "RevocationNotificationLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RevocationNotificationLog_applicantId_createdAt_idx" ON "RevocationNotificationLog"("applicantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RevocationNotificationLog_applicationId_eventType_key" ON "RevocationNotificationLog"("applicationId", "eventType");

-- AddForeignKey
ALTER TABLE "RevocationNotificationLog" ADD CONSTRAINT "RevocationNotificationLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevocationNotificationLog" ADD CONSTRAINT "RevocationNotificationLog_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevocationNotificationLog" ADD CONSTRAINT "RevocationNotificationLog_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
