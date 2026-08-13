/**
 * Send renewal reminder emails (Upcoming / Due / Overdue).
 *
 * Usage:
 *   npx tsx scripts/send-renewal-emails.ts --dry-run
 *   npx tsx scripts/send-renewal-emails.ts
 *   npx tsx scripts/send-renewal-emails.ts --dry-run --business-record-id=<id>
 */

import { loadEnvFile } from "node:process";

loadEnvFile(".env");

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function main() {
  const { runRenewalEmailNotifications } = await import("../src/lib/renewal-email-notifications");
  const { prisma } = await import("../src/lib/prisma");

  const dryRun = process.argv.includes("--dry-run");
  const businessRecordId = readArg("business-record-id");

  console.log("[RENEWAL EMAIL] starting", {
    dryRun,
    businessRecordId: businessRecordId ?? null,
    renewalEmailEnabled: process.env.RENEWAL_EMAIL_ENABLED?.trim().toLowerCase() === "true",
    smtpConfigured: Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim()),
  });

  const summary = await runRenewalEmailNotifications({
    dryRun,
    businessRecordId,
  });

  console.log("[RENEWAL EMAIL] summary", {
    dryRun: summary.dryRun,
    scanned: summary.scanned,
    eligible: summary.eligible,
    sent: summary.sent,
    skipped: summary.skipped,
    failed: summary.failed,
    wouldSend: summary.wouldSend,
  });

  const actionable = summary.details.filter(
    (item) => item.outcome === "WOULD_SEND" || item.outcome === "SENT" || item.outcome === "FAILED"
  );

  if (actionable.length > 0) {
    console.log("[RENEWAL EMAIL] actionable results:");
    for (const item of actionable) {
      console.log(
        `  - ${item.businessName} (${item.businessRecordId}) [${item.notificationType}] -> ${item.outcome}${item.reason ? ` (${item.reason})` : ""}`
      );
    }
  }

  await prisma.$disconnect();

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[RENEWAL EMAIL] fatal error", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
