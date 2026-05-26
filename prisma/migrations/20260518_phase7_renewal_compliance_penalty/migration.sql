-- Phase 7: Add renewal compliance penalty fields to SystemFeeSetting
-- These fields store the fixed penalty amounts (in PHP) per violation severity
-- for RENEWAL_RELATED non-compliance cases detected during JIT inspection.

ALTER TABLE "SystemFeeSetting" ADD COLUMN "renewalComplianceMinorPenalty"  DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "SystemFeeSetting" ADD COLUMN "renewalComplianceMajorPenalty"  DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "SystemFeeSetting" ADD COLUMN "renewalComplianceSeverePenalty" DECIMAL NOT NULL DEFAULT 0;
