import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const latest = await prisma.businessApplication.findFirst({
    where: {
      applicant: { role: "APPLICANT" },
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      applicant: { select: { email: true } },
      history: { select: { id: true } },
    },
  });

  const countAny = await prisma.businessApplication.count({
    where: {
      applicant: { role: "APPLICANT" },
    },
  });

  const countSubmitted = await prisma.businessApplication.count({
    where: {
      applicant: { role: "APPLICANT" },
      submittedAt: { not: null },
      status: "SUBMITTED",
    },
  });

  console.log(
    JSON.stringify(
      {
        countAny,
        countSubmitted,
        latest: latest
          ? {
              applicationNumber: latest.applicationNumber,
              applicationType: latest.applicationType,
              status: latest.status,
              submittedAt: latest.submittedAt
                ? latest.submittedAt.toISOString()
                : null,
              applicantEmail: latest.applicant.email,
              historyCount: latest.history.length,
            }
          : null,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
