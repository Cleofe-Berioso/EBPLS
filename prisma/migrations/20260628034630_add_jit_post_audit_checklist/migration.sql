-- CreateEnum
CREATE TYPE "JitChecklistResponse" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "JitChecklistDepartment" AS ENUM ('BPLO', 'ZONING_PLANNING', 'ENGINEERING', 'FIRE_SAFETY', 'HEALTH_SANITARY', 'ENVIRONMENT', 'TREASURER_ASSESSMENT', 'DECLARATION_VERIFICATION');

-- CreateTable
CREATE TABLE "InspectionChecklistItem" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "departmentKey" "JitChecklistDepartment" NOT NULL,
    "question" TEXT NOT NULL,
    "response" "JitChecklistResponse" NOT NULL,
    "remarks" TEXT,
    "evidenceFileName" TEXT,
    "evidenceStoragePath" TEXT,
    "evidenceBucket" TEXT,
    "evidenceMimeType" TEXT,
    "evidenceSizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspectionChecklistItem_inspectionId_idx" ON "InspectionChecklistItem"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionChecklistItem_inspectionId_departmentKey_key" ON "InspectionChecklistItem"("inspectionId", "departmentKey");

-- AddForeignKey
ALTER TABLE "InspectionChecklistItem" ADD CONSTRAINT "InspectionChecklistItem_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
