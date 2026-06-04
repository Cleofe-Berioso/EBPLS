import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { createStorageSignedUrlByPath } from "@/lib/document-storage";

const PROFILE_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 30;

async function resolveSignedProfileImageUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath) return null;

  try {
    const signed = await createStorageSignedUrlByPath({
      storagePath,
      expiresIn: PROFILE_IMAGE_SIGNED_URL_TTL_SECONDS,
    });
    return signed.signedUrl;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { storagePath } = body as Record<string, unknown>;

  if (!storagePath || typeof storagePath !== "string") {
    return NextResponse.json({ error: "Storage path is required." }, { status: 400 });
  }

  try {
    const signedUrl = await resolveSignedProfileImageUrl(storagePath);

    return NextResponse.json(
      { signedUrl },
      {
        headers: {
          "Cache-Control": "private, no-store, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Unable to generate signed URL." }, { status: 500 });
  }
}
