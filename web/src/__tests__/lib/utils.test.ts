import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  generateApplicationNumber,
  generatePermitNumber,
  generateClaimReference,
  isValidPhPhone,
  truncate,
  getStatusColor,
  validateFile,
} from "@/lib/utils";

describe("cn (className merge)", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("formatCurrency", () => {
  it("formats Philippine Peso correctly", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1,234.56");
  });

  it("handles zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0.00");
  });

  it("handles large numbers", () => {
    const result = formatCurrency(1000000);
    expect(result).toContain("1,000,000.00");
  });
});

describe("formatDate", () => {
  it("formats date string", () => {
    const result = formatDate("2026-03-01");
    expect(result).toContain("2026");
    expect(result).toContain("March");
  });

  it("formats Date object", () => {
    const result = formatDate(new Date("2026-01-15"));
    expect(result).toContain("January");
    expect(result).toContain("15");
  });
});

describe("generateApplicationNumber", () => {
  it("generates correct format", () => {
    const num = generateApplicationNumber(1);
    expect(num).toMatch(/^BP-\d{4}-\d{6}$/);
  });

  it("pads sequence correctly", () => {
    const num = generateApplicationNumber(42);
    expect(num).toContain("000042");
  });

  it("uses current year", () => {
    const num = generateApplicationNumber(1);
    expect(num).toContain(String(new Date().getFullYear()));
  });
});

describe("generatePermitNumber", () => {
  it("generates correct format", () => {
    const num = generatePermitNumber(1);
    expect(num).toMatch(/^PERMIT-\d{4}-\d{6}$/);
  });
});

describe("generateClaimReference", () => {
  it("generates correct format", () => {
    const ref = generateClaimReference();
    expect(ref).toMatch(/^CLM-\d{8}-[A-Z0-9]{6}$/);
  });

  it("generates unique values", () => {
    const refs = new Set(Array.from({ length: 100 }, () => generateClaimReference()));
    expect(refs.size).toBeGreaterThan(95); // Allow minimal collision
  });
});

describe("isValidPhPhone", () => {
  it("accepts valid mobile numbers with 09", () => {
    expect(isValidPhPhone("09171234567")).toBe(true);
  });

  it("accepts valid mobile numbers with +63", () => {
    expect(isValidPhPhone("+639171234567")).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(isValidPhPhone("1234567890")).toBe(false);
    expect(isValidPhPhone("")).toBe(false);
    expect(isValidPhPhone("08171234567")).toBe(false);
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("does not truncate short text", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });
});

describe("getStatusColor", () => {
  it("returns correct color for PAID", () => {
    expect(getStatusColor("PAID")).toContain("green");
  });

  it("returns correct color for REJECTED", () => {
    expect(getStatusColor("REJECTED")).toContain("red");
  });

  it("returns default for unknown status", () => {
    expect(getStatusColor("UNKNOWN")).toContain("gray");
  });
});

describe("validateFile", () => {
  it("accepts valid PDF", () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    expect(validateFile(file)).toEqual({ valid: true });
  });

  it("accepts valid JPEG", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    expect(validateFile(file)).toEqual({ valid: true });
  });

  it("rejects invalid file type", () => {
    const file = new File(["content"], "test.exe", { type: "application/exe" });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file type");
  });

  it("rejects oversized files", () => {
    const bigContent = new Uint8Array(11 * 1024 * 1024); // 11MB
    const file = new File([bigContent], "big.pdf", { type: "application/pdf" });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10MB");
  });
});
