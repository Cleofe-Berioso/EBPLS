import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";

function resolveApplicantPhone(formData: unknown): string | null {
  const maybe = (formData ?? {}) as Record<string, unknown>;
  const rawPhone = maybe.phone;
  if (typeof rawPhone !== "string") return null;
  const trimmed = rawPhone.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkSmsEnvConfiguration(): { ok: boolean; details: string } {
  const smsEnabled = process.env.SMS_ENABLED?.trim().toLowerCase() === "true";
  const provider = process.env.SMS_PROVIDER?.trim().toLowerCase() ?? "semaphore";

  if (!smsEnabled) {
    return {
      ok: true,
      details: "SMS_ENABLED is false. SMS optional mode active; delivery log should still record SKIPPED.",
    };
  }

  if (provider === "twilio") {
    const hasConfig = Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim() &&
        process.env.TWILIO_FROM_NUMBER?.trim()
    );
    return {
      ok: hasConfig,
      details: hasConfig
        ? "Twilio environment variables configured."
        : "Missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER while SMS_ENABLED=true.",
    };
  }

  if (provider === "semaphore") {
    const hasConfig = Boolean(process.env.SEMAPHORE_API_KEY?.trim());
    return {
      ok: hasConfig,
      details: hasConfig
        ? "Semaphore environment variables configured."
        : "Missing SEMAPHORE_API_KEY while SMS_ENABLED=true.",
    };
  }

  return {
    ok: false,
    details: `Unsupported SMS_PROVIDER: ${provider}`,
  };
}

async function main() {
  let candidates = await prisma.businessApplication.findMany({
    where: {
      status: {
        in: ["FOR_RELEASE", "RELEASED"],
      },
    },
    include: {
      applicant: { select: { id: true, name: true } },
      businessRecord: { select: { businessName: true, phone: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });

  if (candidates.length === 0) {
    candidates = await prisma.businessApplication.findMany({
      include: {
        applicant: { select: { id: true, name: true } },
        businessRecord: { select: { businessName: true, phone: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    });
    console.warn(
      "[SMS VERIFY] No FOR_RELEASE/RELEASED records found. Using recent applications for phone and linkage checks."
    );
  }

  assert(candidates.length > 0, "No applications found for SMS verification.");

  const selected = candidates.find((app) => {
    const phone = resolveApplicantPhone(app.formData) ?? app.businessRecord?.phone ?? null;
    return Boolean(phone && phone.trim().length > 0);
  });

  assert(selected, "No candidate application has phone number in formData.phone or BusinessRecord.phone.");

  const selectedApp = selected!;
  const phone = resolveApplicantPhone(selectedApp.formData) ?? selectedApp.businessRecord?.phone ?? null;

  assert(phone, "Selected application does not have phone number.");
  console.log("[SMS VERIFY] Phone check: PASS", {
    applicationId: selectedApp.id,
    applicationNumber: selectedApp.applicationNumber,
    phone,
  });

  const envCheck = checkSmsEnvConfiguration();
  assert(envCheck.ok, `[SMS VERIFY] Env check failed: ${envCheck.details}`);
  console.log("[SMS VERIFY] Env check: PASS", { details: envCheck.details });

  const permitIssuanceSource = await readFile("src/lib/bplo-permit-issuance.ts", "utf8");
  const smsSource = await readFile("src/lib/sms.ts", "utf8");

  const forReleaseTriggerCount = (permitIssuanceSource.match(/status:\s*\"FOR_RELEASE\"\s+as\s+const/g) ?? []).length;
  const releasedTriggerCount = (permitIssuanceSource.match(/status:\s*\"RELEASED\"\s+as\s+const/g) ?? []).length;
  const senderCallCount = (permitIssuanceSource.match(/sendReleaseStatusSms\(/g) ?? []).length;
  const hasDeliveryLogCreate = smsSource.includes("prisma.smsDeliveryLog.create");

  assert(forReleaseTriggerCount >= 1, "FOR_RELEASE trigger context for SMS not found.");
  assert(releasedTriggerCount >= 1, "RELEASED trigger context for SMS not found.");
  assert(senderCallCount >= 2, "Expected sendReleaseStatusSms calls for prepare/release flows.");
  assert(hasDeliveryLogCreate, "SmsDeliveryLog creation not found in SMS sender implementation.");

  console.log("[SMS VERIFY] Trigger log linkage check: PASS", {
    forReleaseTriggerCount,
    releasedTriggerCount,
    senderCallCount,
    hasDeliveryLogCreate,
  });

  console.log("verify-sms-delivery-log: PASS");
}

main()
  .catch((error) => {
    console.error("verify-sms-delivery-log: FAIL", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
