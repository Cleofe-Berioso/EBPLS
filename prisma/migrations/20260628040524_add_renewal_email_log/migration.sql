-- CreateEnum
CREATE TYPE "RenewalEmailNotificationType" AS ENUM ('UPCOMING', 'DUE', 'OVERDUE');

-- CreateEnum
CREATE TYPE "RenewalEmailDeliveryStatus" AS ENUM ('SKIPPED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "RenewalEmailLog" (
    "id" TEXT NOT NULL,
    "businessRecordId" TEXT NOT NULL,
    "applicantId" TEXT,
    "applicationId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "notificationType" "RenewalEmailNotificationType" NOT NULL,
    "permitExpirationDate" TIMESTAMP(3) NOT NULL,
    "permitNumber" TEXT,
    "businessName" TEXT NOT NULL,
    "status" "RenewalEmailDeliveryStatus" NOT NULL,
    "subject" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "skipReason" TEXT,
    "providerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenewalEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RenewalEmailLog_status_createdAt_idx" ON "RenewalEmailLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RenewalEmailLog_applicantId_createdAt_idx" ON "RenewalEmailLog"("applicantId", "createdAt");

-- CreateIndex
CREATE INDEX "RenewalEmailLog_businessRecordId_createdAt_idx" ON "RenewalEmailLog"("businessRecordId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RenewalEmailLog_businessRecordId_permitExpirationDate_notif_key" ON "RenewalEmailLog"("businessRecordId", "permitExpirationDate", "notificationType");

-- AddForeignKey
ALTER TABLE "RenewalEmailLog" ADD CONSTRAINT "RenewalEmailLog_businessRecordId_fkey" FOREIGN KEY ("businessRecordId") REFERENCES "BusinessRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalEmailLog" ADD CONSTRAINT "RenewalEmailLog_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalEmailLog" ADD CONSTRAINT "RenewalEmailLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
