import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), ".uploads", "applicant-documents");

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const latest = await prisma.businessApplication.findFirst({
    where: {
      applicant: { role: "APPLICANT" },
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      applicant: { select: { email: true } },
      history: { select: { id: true } },
      documents: {
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          documentName: true,
          fileName: true,
          storagePath: true,
          uploadedAt: true,
        },
      },
    },
  });

  const latestSubmitted = await prisma.businessApplication.findFirst({
    where: {
      applicant: { role: "APPLICANT" },
      status: "SUBMITTED",
      submittedAt: { not: null },
    },
    orderBy: [{ submittedAt: "desc" }],
    include: {
      applicant: { select: { email: true } },
      documents: {
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          documentName: true,
          fileName: true,
          storagePath: true,
          uploadedAt: true,
        },
      },
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

  const countDocuments = await prisma.applicationDocument.count({
    where: {
      application: {
        applicant: { role: "APPLICANT" },
      },
    },
  });

  const uploadFiles = await readdir(UPLOAD_DIR).catch(() => [] as string[]);

  const latestDocuments = latest
    ? await Promise.all(
        latest.documents.map(async (doc) => ({
          id: doc.id,
          documentName: doc.documentName,
          fileName: doc.fileName,
          uploadedAt: doc.uploadedAt.toISOString(),
          fileExists: await pathExists(doc.storagePath),
        }))
      )
    : [];

  const latestSubmittedDocuments = latestSubmitted
    ? await Promise.all(
        latestSubmitted.documents.map(async (doc) => ({
          id: doc.id,
          documentName: doc.documentName,
          fileName: doc.fileName,
          uploadedAt: doc.uploadedAt.toISOString(),
          fileExists: await pathExists(doc.storagePath),
        }))
      )
    : [];

  console.log(
    JSON.stringify(
      {
        countAny,
        countSubmitted,
        countDocuments,
        uploadDirectory: UPLOAD_DIR,
        uploadFileCount: uploadFiles.length,
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
              documentCount: latest.documents.length,
              documents: latestDocuments,
            }
          : null,
        latestSubmitted: latestSubmitted
          ? {
              applicationNumber: latestSubmitted.applicationNumber,
              applicationType: latestSubmitted.applicationType,
              status: latestSubmitted.status,
              submittedAt: latestSubmitted.submittedAt
                ? latestSubmitted.submittedAt.toISOString()
                : null,
              applicantEmail: latestSubmitted.applicant.email,
              documentCount: latestSubmitted.documents.length,
              documents: latestSubmittedDocuments,
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
