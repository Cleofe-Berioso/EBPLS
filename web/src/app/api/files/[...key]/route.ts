/**
 * Local File Server — serves uploaded files from ./uploads/ during development
 * Only active when STORAGE_DRIVER=local or S3_ENDPOINT is not set.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  // Only serve local files when S3 is not configured
  if (process.env.STORAGE_DRIVER !== "local" && process.env.S3_ENDPOINT) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Auth check
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  const filePath = path.join(process.cwd(), "uploads", ...key);

  // Prevent path traversal
  const uploadDir = path.resolve(process.cwd(), "uploads");
  const resolvedFilePath = path.resolve(filePath);
  if (resolvedFilePath !== uploadDir && !resolvedFilePath.startsWith(uploadDir + path.sep)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // For document files, verify the user has access
  if (key[0] === "documents") {
    const filePath = key.join("/");
    const document = await prisma.document.findFirst({
      where: { filePath },
      include: { application: { select: { applicantId: true } } },
    });
    if (!document) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (session.user.role !== "APPLICANT" && session.user.role !== "BPLO_OFFICE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      session.user.role === "APPLICANT" &&
      document.application.applicantId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType[ext] || "application/octet-stream",
      "Content-Disposition": `inline; filename="${key[key.length - 1]}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
