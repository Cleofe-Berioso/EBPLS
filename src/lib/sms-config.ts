export type SmsProviderName = "twilio" | "semaphore" | "none";

/**
 * SMS is enabled only when SMS_ENABLED trims to "true" (case-insensitive).
 * Missing, false, empty, or any other value keeps SMS disabled.
 */
export function isSmsEnabled(): boolean {
  return process.env.SMS_ENABLED?.trim().toLowerCase() === "true";
}

export function getSmsProviderEnvLabel(): string {
  return process.env.SMS_PROVIDER?.trim().toLowerCase() ?? "semaphore";
}

export function resolveSmsProvider(): SmsProviderName {
  const providerEnv = getSmsProviderEnvLabel();
  if (providerEnv === "twilio") return "twilio";
  if (providerEnv === "semaphore") return "semaphore";
  return "none";
}

export function checkSmsProviderEnvConfiguration(): { ok: boolean; details: string } {
  const smsEnabled = isSmsEnabled();
  const provider = getSmsProviderEnvLabel();

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
