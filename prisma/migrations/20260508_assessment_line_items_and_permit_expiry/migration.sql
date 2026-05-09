ALTER TABLE "BusinessRecord" ADD COLUMN "isMarket" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BusinessRecord" ADD COLUMN "isAgriculture" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BusinessRecord" ADD COLUMN "permitExpirationDate" DATETIME;

ALTER TABLE "FeeAssessment" ADD COLUMN "closurePaymentDues" DECIMAL NOT NULL DEFAULT 0;

CREATE TABLE "FeeAssessmentLineItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "feeAssessmentId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isSystemGenerated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "FeeAssessmentLineItem_feeAssessmentId_fkey" FOREIGN KEY ("feeAssessmentId") REFERENCES "FeeAssessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FeeAssessmentLineItem_feeAssessmentId_sortOrder_idx" ON "FeeAssessmentLineItem"("feeAssessmentId", "sortOrder");
