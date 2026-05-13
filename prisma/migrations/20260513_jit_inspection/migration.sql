-- Phase 10: JIT inspection records
-- Non-destructive: additive table only.

CREATE TABLE "Inspection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessRecordId" TEXT NOT NULL,
  "applicationId" TEXT,
  "inspectorId" TEXT NOT NULL,
  "complianceStatus" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "comment" TEXT,
  "evidenceFileName" TEXT,
  "evidenceStoragePath" TEXT,
  "evidenceMimeType" TEXT,
  "evidenceSizeBytes" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Inspection_businessRecordId_fkey"
    FOREIGN KEY ("businessRecordId") REFERENCES "BusinessRecord" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Inspection_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Inspection_inspectorId_fkey"
    FOREIGN KEY ("inspectorId") REFERENCES "User" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Inspection_businessRecordId_createdAt_idx" ON "Inspection"("businessRecordId", "createdAt");
CREATE INDEX "Inspection_applicationId_createdAt_idx" ON "Inspection"("applicationId", "createdAt");
CREATE INDEX "Inspection_inspectorId_createdAt_idx" ON "Inspection"("inspectorId", "createdAt");
CREATE INDEX "Inspection_status_createdAt_idx" ON "Inspection"("status", "createdAt");
