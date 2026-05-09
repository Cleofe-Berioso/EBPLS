function toReleasePaymentAmount(annual: number, frequency: "ANNUAL" | "BI_ANNUAL" | "QUARTERLY") {
  if (frequency === "BI_ANNUAL") return annual / 2;
  if (frequency === "QUARTERLY") return annual / 4;
  return annual;
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const annual = 6000;
assert(toReleasePaymentAmount(annual, "ANNUAL") === 6000, "Annual frequency failed");
assert(toReleasePaymentAmount(annual, "BI_ANNUAL") === 3000, "Bi-annual frequency failed");
assert(toReleasePaymentAmount(annual, "QUARTERLY") === 1500, "Quarterly frequency failed");

console.log("verify-core-logic: PASS");

export {};
