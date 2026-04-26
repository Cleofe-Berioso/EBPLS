import { z } from "zod";

// ============================================================================
// Enum Exports (from Prisma schema)
// ============================================================================

export const ClosureReasonEnum = z.enum([
  "RETIREMENT",
  "RELOCATION",
  "SOLD_TRANSFERRED",
  "LIQUIDATION",
  "CALAMITY",
  "OTHER",
]);

export const DocumentTypeEnum = z.enum([
  "PROOF_OF_REGISTRATION",
  "PROOF_OF_OWNERSHIP",
  "LOCATION_PLAN",
  "FSIC",
  "AFFIDAVIT",
  "BARANGAY_CLEARANCE",
  "OTHER",
]);

export type ClosureReason = z.infer<typeof ClosureReasonEnum>;
export type DocumentType = z.infer<typeof DocumentTypeEnum>;

// ============================================================================
// User Validations
// ============================================================================

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be at most 50 characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be at most 50 characters"),
    middleName: z.string().max(50).optional(),
    phone: z
      .string()
      .regex(
        /^(\+63|0)(9\d{9})$/,
        "Invalid Philippine phone number (e.g., 09171234567)"
      )
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const otpVerificationSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

export const passwordResetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  middleName: z.string().max(50).optional(),
  phone: z
    .string()
    .regex(/^(\+63|0)(9\d{9})$/, "Invalid Philippine phone number")
    .optional()
    .or(z.literal("")),
});

// ============================================================================
// Application Validations
// ============================================================================

export const applicationSchema = z
  .object({
    type: z.enum(["NEW", "RENEWAL", "CLOSURE"]),
    businessName: z
      .string()
      .min(2, "Business name is required")
      .max(200, "Business name is too long"),
    businessTypeCategory: z
      .enum(["SOLE_PROPRIETORSHIP", "PARTNERSHIP", "CORPORATION", "COOPERATIVE"], {
        errorMap: () => ({ message: "Please select a valid business type" }),
      })
      .optional(),
    businessType: z.string().min(1, "Business type is required"),
    lineOfBusiness: z
      .string()
      .min(2, "Line of business is required")
      .max(200, "Line of business is too long")
      .optional(),
    businessAddress: z.string().min(5, "Business address is required"),
    businessBarangay: z.string().optional(),
    businessCity: z.string().optional(),
    businessProvince: z.string().optional(),
    businessZipCode: z
      .string()
      .regex(/^\d{4}$/, "ZIP code must be 4 digits")
      .optional()
      .or(z.literal("")),
    businessPhone: z.string().optional(),
    businessEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    dtiSecRegistration: z.string().optional(),
    tinNumber: z
      .string()
      .regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/, "Invalid TIN format (xxx-xxx-xxx-xxx)")
      .optional()
      .or(z.literal("")),
    sssNumber: z.string().optional(),
    businessArea: z.coerce.number().positive().optional(),
    assetValue: z.coerce.number().positive().optional(),
    monthlyRental: z.coerce.number().positive().optional(),
    numberOfEmployees: z.coerce.number().int().positive().optional(),
    capitalInvestment: z.coerce.number().nonnegative().optional(),
    ownerName: z
      .string()
      .min(2, "Owner name is required")
      .max(100, "Owner name is too long")
      .optional(),
    ownerBirthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
    ownerResidenceAddress: z
      .string()
      .min(5, "Residence address is required")
      .max(300, "Residence address is too long")
      .optional(),
    ownerPhone: z
      .string()
      .regex(/^(\+63|0)(9\d{9})$/, "Invalid Philippine phone number")
      .optional()
      .or(z.literal("")),
    grossSales: z.coerce.number().nonnegative().optional(),
    previousPermitId: z.string().optional(),
    // CLOSURE-specific fields
    closureReason: z
      .string()
      .min(5, "Closure reason must be at least 5 characters")
      .optional(),
    closureEffectiveDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
  })
  .refine((data) => {
    // CLOSURE type requires closure-specific fields
    if (data.type === "CLOSURE") {
      return data.closureReason && data.closureEffectiveDate;
    }
    return true;
  }, {
    message: "Closure reason and effective date are required for CLOSURE applications",
    path: ["closureReason"],
  })
  .refine((data) => {
    // RENEWAL requires Gross Sales or previous permit
    if (data.type === "RENEWAL") {
      return data.grossSales !== undefined || data.previousPermitId;
    }
    return true;
  }, {
    message: "Renewal requires either Gross Sales information or a previous permit reference",
    path: ["grossSales"],
  });

// ============================================================================
// Payment Validations
// ============================================================================

export const paymentSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  method: z.enum(["GCASH", "MAYA", "BANK_TRANSFER", "OTC", "CASH"]).refine(Boolean, {
    message: "Invalid payment method",
  }),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// Review Action Validations
// ============================================================================

export const reviewActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION", "COMMENT"]).refine(Boolean, {
    message: "Invalid review action",
  }),
  comment: z.string().max(1000).optional(),
});

// ============================================================================
// Admin User Validations
// ============================================================================

export const adminCreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters"),
  phone: z
    .string()
    .regex(/^(\+63|0)(9\d{9})$/, "Invalid Philippine phone number")
    .optional()
    .or(z.literal("")),
  role: z.enum(["APPLICANT", "BPLO_OFFICE", "ADMIN"]),
});

export const adminUpdateUserSchema = z.object({
  role: z.enum(["APPLICANT", "BPLO_OFFICE", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).optional(),
  resetPassword: z.boolean().optional(),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ReviewActionInput = z.infer<typeof reviewActionSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

// ============================================================================
// Permit Application Validations (Multi-step Business Permit Application)
// ============================================================================

export const permitApplicationStep1Schema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(200, "Business name is too long"),
  businessType: z.string().min(1, "Business type is required"),
  ownerName: z
    .string()
    .min(2, "Owner/Operator name must be at least 2 characters")
    .max(100, "Owner name is too long"),
  tinNumber: z
    .string()
    .regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/, "Invalid TIN format (xxx-xxx-xxx-xxx)")
    .optional()
    .or(z.literal("")),
  barangay: z.string().min(1, "Barangay is required"),
  municipality: z.string().min(1, "Municipality is required"),
  businessAddress: z
    .string()
    .min(5, "Business address is required")
    .max(300, "Address is too long"),
});

export const permitApplicationStep2Schema = z.object({
  documents: z
    .array(
      z.object({
        type: z.string().min(1, "Document type is required"),
        fileName: z.string(),
      })
    )
    .optional(),
});

export const permitApplicationStep3Schema = z.object({
  businessArea: z.coerce
    .number()
    .positive("Business area must be greater than 0")
    .optional(),
  numberOfEmployees: z.coerce
    .number()
    .int()
    .nonnegative("Number of employees must be 0 or more")
    .optional(),
  capitalInvestment: z.coerce
    .number()
    .nonnegative("Capital investment must be 0 or more")
    .optional(),
  assessmentNotes: z.string().max(1000, "Assessment notes is too long").optional(),
});

export const permitApplicationStep4Schema = z.object({
  paymentMethod: z.enum(["GCASH", "MAYA", "BANK_TRANSFER", "OTC", "CASH"], {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
  paymentNotes: z.string().max(500, "Payment notes is too long").optional(),
});

export const permitApplicationStep5Schema = z.object({
  agreedToTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must agree to submit this application",
    }),
});

export const fullPermitApplicationSchema = permitApplicationStep1Schema
  .merge(permitApplicationStep4Schema)
  .merge(permitApplicationStep5Schema);

// ============================================================================
// P2.1: Application Type & Duplicate Check Validations
// ============================================================================

export const applicationTypeSchema = z.object({
  type: z.enum(["NEW", "RENEWAL"], {
    errorMap: () => ({ message: "Please select either NEW or RENEWAL application" }),
  }),
  previousPermitId: z.string().optional(),
});

export const checkDuplicateSchema = z.object({
  type: z.enum(["NEW", "RENEWAL"]),
  previousPermitId: z.string().optional(),
  // Note: userId comes from auth session, not from body
});

/**
 * P2.2: Application Form Submission Validation
 * Step-by-step validation for multi-step form
 */
export const applicationStep1Schema = z.object({
  type: z.enum(["NEW", "RENEWAL"]),
  previousPermitId: z.string().min(1, "Permit selection required").optional(),
});

export const applicationStep2Schema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(200, "Business name must be less than 200 characters"),
  businessTypeCategory: z
    .enum(["SOLE_PROPRIETORSHIP", "PARTNERSHIP", "CORPORATION", "COOPERATIVE"], {
      errorMap: () => ({ message: "Please select a valid business type" }),
    })
    .optional(),
  businessType: z
    .string()
    .min(1, "Business type is required")
    .optional(),
  lineOfBusiness: z
    .string()
    .min(2, "Line of business is required")
    .max(200, "Line of business is too long")
    .optional(),
  businessAddress: z
    .string()
    .min(5, "Business address must be at least 5 characters")
    .max(300, "Business address must be less than 300 characters"),
  businessBarangay: z.string().optional(),
  businessCity: z.string().optional(),
  businessProvince: z.string().optional(),
  businessZipCode: z
    .string()
    .regex(/^\d{4}$/, "ZIP code must be 4 digits")
    .optional()
    .or(z.literal("")),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  dtiSecRegistration: z.string().optional(),
  tinNumber: z
    .string()
    .regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/, "Invalid TIN format (xxx-xxx-xxx-xxx)")
    .optional()
    .or(z.literal("")),
  sssNumber: z.string().optional(),
  businessArea: z.coerce
    .number()
    .positive("Business area must be greater than 0")
    .optional(),
  assetValue: z.coerce
    .number()
    .positive("Asset value must be greater than 0")
    .optional(),
  monthlyRental: z.coerce
    .number()
    .positive("Monthly rental must be greater than 0")
    .optional(),
  numberOfEmployees: z.coerce
    .number()
    .int("Number of employees must be a whole number")
    .positive("Number of employees must be greater than 0")
    .optional(),
  capitalInvestment: z.coerce
    .number()
    .nonnegative("Capital investment must be 0 or greater")
    .optional(),
  ownerName: z
    .string()
    .min(2, "Owner name must be at least 2 characters")
    .max(100, "Owner name is too long")
    .optional(),
  ownerBirthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
  ownerResidenceAddress: z
    .string()
    .min(5, "Residence address must be at least 5 characters")
    .max(300, "Residence address is too long")
    .optional(),
  ownerPhone: z
    .string()
    .regex(/^(\+63|0)(9\d{9})$/, "Invalid Philippine phone number")
    .optional()
    .or(z.literal("")),
});

export const applicationSubmitSchema = applicationStep1Schema
  .merge(applicationStep2Schema);

// ============================================================================
// P2.3: Document Upload Validation
// ============================================================================

export const documentUploadSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  documentType: DocumentTypeEnum,
  // files validated on client with FormData
});

export const documentTypeVerificationSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  status: z.enum(["VERIFIED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

// ============================================================================
// P3.0: Clearance & Endorsement Validation
// ============================================================================

export const clearanceUpdateSchema = z.object({
  status: z.enum(["CLEARED", "WITH_DEFICIENCY", "FOR_INSPECTION"], {
    errorMap: () => ({ message: "Invalid clearance status" }),
  }),
  remarks: z.string().max(1000, "Remarks cannot exceed 1000 characters").optional(),
});

export const requirementLabelSchema = z.object({
  requirementCode: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .toUpperCase(),
  requirementName: z.string().min(2, "Name must be at least 2 characters"),
});

// ============================================================================
// P5: Permit Issuance Validation
// ============================================================================

export const permitListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["ACTIVE", "EXPIRED", "REVOKED", "RENEWED", "CLOSED"]).optional(),
  search: z.string().max(100).optional(),
});

export const permitPrintSchema = z.object({
  quantity: z.number().int().min(1).max(10).default(1),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// P6: Claims & Reporting Validation
// ============================================================================

export const verifyPermitSchema = z.object({
  reference: z.string().optional(),
  qrCode: z.string().optional(),
}).refine(data => data.reference || data.qrCode, {
  message: "Either reference or qrCode is required",
});

export const reportExportSchema = z.object({
  format: z.enum(["csv", "pdf"]).default("csv"),
  dataType: z.enum(["applications", "payments", "claims"]).default("applications"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const businessLocationSchema = z.object({
  applicationId: z.string().cuid("Invalid application ID"),
  latitude: z
    .number()
    .min(10.834893, "Latitude outside EB Magalona area")
    .max(10.920893, "Latitude outside EB Magalona area"),
  longitude: z
    .number()
    .min(122.935881, "Longitude outside EB Magalona area")
    .max(123.019881, "Longitude outside EB Magalona area"),
  label: z.string().max(100).optional().nullable(),
  businessType: z.string().max(100).optional().nullable(),
  markerColor: z.string().default("blue"),
});

// Permit Issuance Update Actions (Mayor Signing, Release, etc.)
export const issuanceUpdateSchema = z.object({
  action: z.enum([
    "READY_FOR_MAYOR",
    "MAYOR_SIGNED",
    "MAYOR_HELD",
    "MAYOR_RETURNED",
    "ISSUE",
    "RELEASE",
    "COMPLETE",
    "CANCEL",
  ]),
  staffNotes: z.string().max(500).optional().nullable(),
  mayorSignedBy: z.string().max(100).optional(), // Required if action is MAYOR_SIGNED
  remarks: z.string().max(500).optional(), // For MAYOR_HELD, MAYOR_RETURNED
});

// ============================================================================
export type PermitApplicationStep1Input = z.infer<typeof permitApplicationStep1Schema>;
export type PermitApplicationStep2Input = z.infer<typeof permitApplicationStep2Schema>;
export type PermitApplicationStep3Input = z.infer<typeof permitApplicationStep3Schema>;
export type PermitApplicationStep4Input = z.infer<typeof permitApplicationStep4Schema>;
export type PermitApplicationStep5Input = z.infer<typeof permitApplicationStep5Schema>;
export type FullPermitApplicationInput = z.infer<typeof fullPermitApplicationSchema>;
export type ApplicationStep1Input = z.infer<typeof applicationStep1Schema>;
export type ApplicationStep2Input = z.infer<typeof applicationStep2Schema>;
export type ApplicationSubmitInput = z.infer<typeof applicationSubmitSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type DocumentTypeVerificationInput = z.infer<typeof documentTypeVerificationSchema>;
export type ClearanceUpdateInput = z.infer<typeof clearanceUpdateSchema>;
export type RequirementLabelInput = z.infer<typeof requirementLabelSchema>;
export type PermitListInput = z.infer<typeof permitListSchema>;
export type PermitPrintInput = z.infer<typeof permitPrintSchema>;
export type VerifyPermitInput = z.infer<typeof verifyPermitSchema>;
export type ReportExportInput = z.infer<typeof reportExportSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type IssuanceUpdateInput = z.infer<typeof issuanceUpdateSchema>;
