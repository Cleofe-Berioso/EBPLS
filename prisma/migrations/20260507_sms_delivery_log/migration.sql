-- CreateEnum
CREATE TYPE "SmsDeliveryStatus" AS ENUM ('SKIPPED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "SmsDeliveryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "applicantId" TEXT,
    "phoneNumber" TEXT,
    "provider" TEXT NOT NULL,
    "status" "SmsDeliveryStatus" NOT NULL,
    "messageBody" TEXT NOT NULL,
    "providerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmsDeliveryLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SmsDeliveryLog_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SmsDeliveryLog_applicationId_createdAt_idx" ON "SmsDeliveryLog"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsDeliveryLog_applicantId_createdAt_idx" ON "SmsDeliveryLog"("applicantId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsDeliveryLog_status_createdAt_idx" ON "SmsDeliveryLog"("status", "createdAt");