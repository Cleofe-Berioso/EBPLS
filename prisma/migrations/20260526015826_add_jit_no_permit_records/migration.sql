-- CreateTable
CREATE TABLE "JitNoPermitRecord" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "personAttended" TEXT NOT NULL,
    "lineOfBusiness" TEXT NOT NULL,
    "remarks" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JitNoPermitRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JitNoPermitRecord_createdById_createdAt_idx" ON "JitNoPermitRecord"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "JitNoPermitRecord_businessName_idx" ON "JitNoPermitRecord"("businessName");

-- CreateIndex
CREATE INDEX "JitNoPermitRecord_createdAt_idx" ON "JitNoPermitRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "JitNoPermitRecord" ADD CONSTRAINT "JitNoPermitRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
