import { prisma } from "@/lib/prisma";
import { logSmsAction } from "@/lib/audit-log";

export type ReleaseSmsStatus = "FOR_RELEASE" | "RELEASED";

export interface ReleaseSmsPayload {
  applicationId: string;
  applicantId?: string | null;
  applicationNumber: string;
  applicantName: string;
  businessName: string;
  status: ReleaseSmsStatus;
  toPhone: string | null;
}

export interface SmsSendResult {
  attempted: boolean;
  sent: boolean;
  provider: "twilio" | "semaphore" | "none";
  reason?: string;
  providerMessageId?: string;
  toPhone: string | null;
}

function isSmsEnabled(): boolean {
  return process.env.SMS_ENABLED?.trim().toLowerCase() === "true";
}

function normalizePhMobile(raw: string | null): string | null {
  if (!raw) return null;
  const compact = raw.replace(/[\s-]/g, "").trim();
  if (/^\+639\d{9}$/.test(compact)) return compact;
  if (/^09\d{9}$/.test(compact)) return `+63${compact.slice(1)}`;
  if (/^639\d{9}$/.test(compact)) return `+${compact}`;
  return null;
}

function shortName(fullName: string): string {
  const value = fullName.trim();
  if (!value) return "Applicant";
  return value.split(/\s+/)[0] ?? "Applicant";
}

function trimMessageForSms(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 480 ? `${clean.slice(0, 477)}...` : clean;
}

function buildReleaseSmsMessage(input: {
  applicantName: string;
  businessName: string;
  applicationNumber: string;
  status: ReleaseSmsStatus;
}): string {
  const instruction =
    input.status === "FOR_RELEASE"
      ? "Please prepare a valid ID and wait for BPLO release instructions."
      : "Please claim your released permit/certificate at BPLO with a valid ID.";

  return trimMessageForSms(
    `Hello ${shortName(input.applicantName)}. eBPLS update: ${input.businessName} ` +
      `(Ref ${input.applicationNumber}) is now ${input.status}. ${instruction}`
  );
}

async function createSmsDeliveryLog(input: {
  applicationId: string;
  applicantId?: string | null;
  phoneNumber: string | null;
  provider: "twilio" | "semaphore" | "none";
  status: "SKIPPED" | "SENT" | "FAILED";
  messageBody: string;
  providerResponse?: string;
}) {
  try {
    await prisma.smsDeliveryLog.create({
      data: {
        applicationId: input.applicationId,
        applicantId: input.applicantId ?? null,
        phoneNumber: input.phoneNumber,
        provider: input.provider,
        status: input.status,
        messageBody: input.messageBody,
        providerResponse: input.providerResponse,
      },
    });
      // Audit: SMS delivery logged
      void logSmsAction(
        null,
        "SMS_SYSTEM",
        input.applicantId,
        null,
        input.applicationId,
        input.status as any,
        input.phoneNumber,
        input.provider,
        input.status,
        `SMS ${input.status.toLowerCase()}: ${input.provider}`,
        { providerResponse: input.providerResponse }
      );
  } catch (error) {
    console.error("[SMS] log failed", {
      applicationId: input.applicationId,
      provider: input.provider,
      status: input.status,
      reason: error instanceof Error ? error.message : "Unknown logging error",
    });
  }
}

async function sendViaTwilio(to: string, body: string): Promise<{ ok: boolean; sid?: string; reason?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    return { ok: false, reason: "Missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER" };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("From", from);
  form.set("Body", body);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const json = (await response.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
    if (!response.ok) {
      return {
        ok: false,
        reason: json.message ? `${json.message}${json.code ? ` (code ${json.code})` : ""}` : `HTTP ${response.status}`,
      };
    }

    return { ok: true, sid: json.sid };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Unknown Twilio error",
    };
  }
}

async function sendViaSemaphore(
  to: string,
  body: string
): Promise<{ ok: boolean; messageId?: string; reason?: string }> {
  const apiKey = process.env.SEMAPHORE_API_KEY?.trim();
  const sender = process.env.SEMAPHORE_SENDER_NAME?.trim();
  const baseUrl = process.env.SEMAPHORE_BASE_URL?.trim() || "https://api.semaphore.co/api/v4/messages";

  if (!apiKey) {
    return { ok: false, reason: "Missing SEMAPHORE_API_KEY" };
  }

  const form = new URLSearchParams();
  form.set("apikey", apiKey);
  form.set("number", to);
  form.set("message", body);
  if (sender) {
    form.set("sendername", sender);
  }

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const json = (await response.json().catch(() => null)) as
      | Array<{ message_id?: number | string; message?: string }>
      | { message?: string }
      | null;

    if (!response.ok) {
      const reason =
        (Array.isArray(json) ? json[0]?.message : json?.message) || `HTTP ${response.status}`;
      return { ok: false, reason };
    }

    const messageId =
      Array.isArray(json) && json[0]?.message_id != null
        ? String(json[0].message_id)
        : undefined;

    return { ok: true, messageId };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Unknown Semaphore error",
    };
  }
}

export async function sendReleaseStatusSms(payload: ReleaseSmsPayload): Promise<SmsSendResult> {
  const normalizedPhone = normalizePhMobile(payload.toPhone);
  const phoneForLog = normalizedPhone ?? payload.toPhone?.trim() ?? null;
  const providerEnv = process.env.SMS_PROVIDER?.trim().toLowerCase() ?? "semaphore";
  const provider =
    providerEnv === "twilio"
      ? "twilio"
      : providerEnv === "semaphore"
        ? "semaphore"
        : "none";
  const body = buildReleaseSmsMessage({
    applicantName: payload.applicantName,
    businessName: payload.businessName,
    applicationNumber: payload.applicationNumber,
    status: payload.status,
  });

  if (!isSmsEnabled()) {
    const reason = "SMS disabled (set SMS_ENABLED=true to enable)";
    console.warn("[SMS] skipped", {
      applicationId: payload.applicationId,
      applicationNumber: payload.applicationNumber,
      status: payload.status,
      reason,
    });
    await createSmsDeliveryLog({
      applicationId: payload.applicationId,
      applicantId: payload.applicantId,
      phoneNumber: phoneForLog,
      provider,
      status: "SKIPPED",
      messageBody: body,
      providerResponse: reason,
    });
    return { attempted: false, sent: false, provider: "none", reason, toPhone: normalizedPhone };
  }

  if (!normalizedPhone) {
    const reason = "Missing or invalid applicant mobile number";
    console.warn("[SMS] skipped", {
      applicationId: payload.applicationId,
      applicationNumber: payload.applicationNumber,
      status: payload.status,
      reason,
      rawPhone: payload.toPhone,
    });
    await createSmsDeliveryLog({
      applicationId: payload.applicationId,
      applicantId: payload.applicantId,
      phoneNumber: phoneForLog,
      provider,
      status: "SKIPPED",
      messageBody: body,
      providerResponse: reason,
    });
    return { attempted: false, sent: false, provider, reason, toPhone: null };
  }

  if (provider === "none") {
    const reason = `Unsupported SMS_PROVIDER: ${providerEnv}`;
    console.warn("[SMS] skipped", {
      applicationId: payload.applicationId,
      applicationNumber: payload.applicationNumber,
      status: payload.status,
      reason,
    });
    await createSmsDeliveryLog({
      applicationId: payload.applicationId,
      applicantId: payload.applicantId,
      phoneNumber: phoneForLog,
      provider,
      status: "SKIPPED",
      messageBody: body,
      providerResponse: reason,
    });
    return { attempted: false, sent: false, provider: "none", reason, toPhone: normalizedPhone };
  }

  if (provider === "twilio") {
    const twilio = await sendViaTwilio(normalizedPhone, body);
    if (!twilio.ok) {
      console.error("[SMS] failed", {
        applicationId: payload.applicationId,
        applicationNumber: payload.applicationNumber,
        status: payload.status,
        provider: "twilio",
        toPhone: normalizedPhone,
        reason: twilio.reason,
      });
      await createSmsDeliveryLog({
        applicationId: payload.applicationId,
        applicantId: payload.applicantId,
        phoneNumber: normalizedPhone,
        provider: "twilio",
        status: "FAILED",
        messageBody: body,
        providerResponse: twilio.reason,
      });
      return {
        attempted: true,
        sent: false,
        provider: "twilio",
        reason: twilio.reason,
        toPhone: normalizedPhone,
      };
    }

    console.info("[SMS] sent", {
      applicationId: payload.applicationId,
      applicationNumber: payload.applicationNumber,
      status: payload.status,
      provider: "twilio",
      toPhone: normalizedPhone,
      providerMessageId: twilio.sid,
    });

    await createSmsDeliveryLog({
      applicationId: payload.applicationId,
      applicantId: payload.applicantId,
      phoneNumber: normalizedPhone,
      provider: "twilio",
      status: "SENT",
      messageBody: body,
      providerResponse: twilio.sid ? `Message SID: ${twilio.sid}` : "Message sent",
    });

    return {
      attempted: true,
      sent: true,
      provider: "twilio",
      providerMessageId: twilio.sid,
      toPhone: normalizedPhone,
    };
  }

  const semaphore = await sendViaSemaphore(normalizedPhone, body);
  if (!semaphore.ok) {
    console.error("[SMS] failed", {
      applicationId: payload.applicationId,
      applicationNumber: payload.applicationNumber,
      status: payload.status,
      provider: "semaphore",
      toPhone: normalizedPhone,
      reason: semaphore.reason,
    });
    await createSmsDeliveryLog({
      applicationId: payload.applicationId,
      applicantId: payload.applicantId,
      phoneNumber: normalizedPhone,
      provider: "semaphore",
      status: "FAILED",
      messageBody: body,
      providerResponse: semaphore.reason,
    });
    return {
      attempted: true,
      sent: false,
      provider: "semaphore",
      reason: semaphore.reason,
      toPhone: normalizedPhone,
    };
  }

  console.info("[SMS] sent", {
    applicationId: payload.applicationId,
    applicationNumber: payload.applicationNumber,
    status: payload.status,
    provider: "semaphore",
    toPhone: normalizedPhone,
    providerMessageId: semaphore.messageId,
  });

  await createSmsDeliveryLog({
    applicationId: payload.applicationId,
    applicantId: payload.applicantId,
    phoneNumber: normalizedPhone,
    provider: "semaphore",
    status: "SENT",
    messageBody: body,
    providerResponse: semaphore.messageId ? `Message ID: ${semaphore.messageId}` : "Message sent",
  });

  return {
    attempted: true,
    sent: true,
    provider: "semaphore",
    providerMessageId: semaphore.messageId,
    toPhone: normalizedPhone,
  };
}