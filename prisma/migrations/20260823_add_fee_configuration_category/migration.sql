-- CreateTable
CREATE TABLE "FeeConfigurationCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "classifications" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeConfigurationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeConfigurationCategory_key_key" ON "FeeConfigurationCategory"("key");

-- CreateIndex
CREATE INDEX "FeeConfigurationCategory_isActive_label_idx" ON "FeeConfigurationCategory"("isActive", "label");

-- AddForeignKey
ALTER TABLE "FeeConfigurationCategory" ADD CONSTRAINT "FeeConfigurationCategory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
