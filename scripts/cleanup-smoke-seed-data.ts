/**
 * One-shot cleanup: remove smoke-test seed data (SMOKE-* apps/records + smoke applicant users).
 * Keeps staff demo accounts (bplo@, superadmin@, dept-head@, jit@, jit-disabled@).
 *
 * Usage: npx tsx scripts/cleanup-smoke-seed-data.ts
 */
import path from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const scriptFilePath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptFilePath), "..");

const SMOKE_APPLICANT_EMAILS = [
  "applicant@example.com",
  "smoke.duplicate@example.com",
] as const;

async function main() {
  try {
    loadEnvFile(path.join(ROOT, ".env"));
  } catch {
    // optional
  }
  try {
    loadEnvFile(path.join(ROOT, ".env.local"));
  } catch {
    // optional
  }

  const { prisma } = await import("../src/lib/prisma");

  const smokeApps = await prisma.businessApplication.findMany({
    where: { applicationNumber: { startsWith: "SMOKE-" } },
    select: { id: true, applicationNumber: true, businessRecordId: true },
  });

  const smokeRecords = await prisma.businessRecord.findMany({
    where: { registrationNumber: { startsWith: "SMOKE-" } },
    select: { id: true, registrationNumber: true, businessName: true },
  });

  const smokeUsers = await prisma.user.findMany({
    where: { email: { in: [...SMOKE_APPLICANT_EMAILS] } },
    select: { id: true, email: true, role: true },
  });

  console.log("[cleanup-smoke] preview", {
    applications: smokeApps.length,
    businessRecords: smokeRecords.length,
    applicantUsers: smokeUsers.map((u) => u.email),
  });

  if (smokeApps.length === 0 && smokeRecords.length === 0 && smokeUsers.length === 0) {
    // Broader inventory if smoke prefixes are gone but demo data remains
    const totals = {
      applications: await prisma.businessApplication.count(),
      businessRecords: await prisma.businessRecord.count(),
      exampleUsers: await prisma.user.count({ where: { email: { endsWith: "@example.com" } } }),
    };
    console.log("[cleanup-smoke] no SMOKE-* rows found; inventory:", totals);
    const exampleUsers = await prisma.user.findMany({
      where: { email: { endsWith: "@example.com" } },
      select: { email: true, role: true },
      orderBy: { email: "asc" },
    });
    console.log("[cleanup-smoke] @example.com users:", exampleUsers);
    return;
  }

  const appIds = smokeApps.map((a) => a.id);
  const recordIds = Array.from(
    new Set([
      ...smokeRecords.map((r) => r.id),
      ...smokeApps.map((a) => a.businessRecordId).filter((id): id is string => Boolean(id)),
    ])
  );

  await prisma.$transaction(async (tx) => {
    if (appIds.length > 0) {
      // Clear FK pointers that SetNull / Restrict may block
      await tx.inspection.updateMany({
        where: { applicationId: { in: appIds } },
        data: { applicationId: null },
      });
      await tx.renewalEmailLog.updateMany({
        where: { applicationId: { in: appIds } },
        data: { applicationId: null },
      });
      await tx.auditLog.deleteMany({
        where: { applicationId: { in: appIds } },
      });

      const deletedApps = await tx.businessApplication.deleteMany({
        where: { id: { in: appIds } },
      });
      console.log("[cleanup-smoke] deleted applications", deletedApps.count);
    }

    if (recordIds.length > 0) {
      await tx.businessRecord.updateMany({
        where: { closureApplicationId: { in: appIds } },
        data: { closureApplicationId: null },
      });
      await tx.auditLog.deleteMany({
        where: { businessRecordId: { in: recordIds } },
      });
      const deletedRecords = await tx.businessRecord.deleteMany({
        where: { id: { in: recordIds } },
      });
      console.log("[cleanup-smoke] deleted business records", deletedRecords.count);
    }

    // Any leftover apps owned only by smoke applicants
    if (smokeUsers.length > 0) {
      const userIds = smokeUsers.map((u) => u.id);
      await tx.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
      await tx.passwordResetOtp.deleteMany({
        where: { email: { in: [...SMOKE_APPLICANT_EMAILS] } },
      });

      // Null out Restrict-sensitive refs where smoke applicants acted as staff (unlikely)
      await tx.businessLocation.updateMany({
        where: { verifiedById: { in: userIds } },
        data: { verifiedById: null },
      });

      // Delete remaining apps/records for these applicants (safety net)
      const leftoverApps = await tx.businessApplication.findMany({
        where: { applicantId: { in: userIds } },
        select: { id: true },
      });
      if (leftoverApps.length > 0) {
        const leftoverIds = leftoverApps.map((a) => a.id);
        await tx.inspection.updateMany({
          where: { applicationId: { in: leftoverIds } },
          data: { applicationId: null },
        });
        await tx.businessApplication.deleteMany({ where: { id: { in: leftoverIds } } });
      }
      await tx.businessRecord.deleteMany({ where: { applicantId: { in: userIds } } });

      // Locations submittedBy Restrict — reassign or delete locations first via record cascade.
      // Users who only submitted locations on deleted records should be free.
      // If still blocked, delete locations they submitted that remain.
      await tx.businessLocation.deleteMany({ where: { submittedById: { in: userIds } } });

      const deletedUsers = await tx.user.deleteMany({ where: { id: { in: userIds } } });
      console.log("[cleanup-smoke] deleted smoke applicant users", deletedUsers.count);
    }
  });

  const after = {
    smokeApps: await prisma.businessApplication.count({
      where: { applicationNumber: { startsWith: "SMOKE-" } },
    }),
    smokeRecords: await prisma.businessRecord.count({
      where: { registrationNumber: { startsWith: "SMOKE-" } },
    }),
    smokeApplicants: await prisma.user.count({
      where: { email: { in: [...SMOKE_APPLICANT_EMAILS] } },
    }),
    remainingBusinessRecords: await prisma.businessRecord.count(),
    remainingApplications: await prisma.businessApplication.count(),
  };
  console.log("[cleanup-smoke] complete", after);
}

main()
  .catch((error) => {
    console.error("[cleanup-smoke] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const { prisma } = await import("../src/lib/prisma");
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  });
