/** Shared fee schedule constants (no DB imports — safe for unit tests). */

export const FIXED_FEE_CLASSIFICATION = "Fixed Fee";

export const BANK_CLASSIFICATIONS = [
  "Rural / Thrift / Savings Banks",
  "Commercial and Development Banks",
  "Universal Banks",
] as const;

export const DEFAULT_CLASSIFICATIONS = [
  "Micro Industry",
  "Cottage Industries A",
  "Cottage Industries B",
  "Small-Scale Industries A",
  "Small-Scale Industries B",
  "Medium-Scale Industries",
  "Large-Scale Industries",
] as const;
