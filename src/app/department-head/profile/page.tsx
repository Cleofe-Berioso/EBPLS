import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";
import { prisma } from "@/lib/prisma";
import { createStorageSignedUrlByPath } from "@/lib/document-storage";
import { DepartmentHeadProfileSettingsClient } from "@/components/department-head/department-head-profile-settings-client";

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

export default async function DepartmentHeadProfilePage() {
  const session = await requireDepartmentHeadSession();
  if (!session?.user?.id) notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      profileImageStoragePath: true,
    },
  });

  if (!user || user.role !== "DEPARTMENT_HEAD") {
    notFound();
  }

  const profilePictureUrl = await resolveSignedProfileImageUrl(user.profileImageStoragePath ?? null);

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Department Head"
        title="Profile"
        description="Update your display name and profile picture. Email, role, and account ID remain read-only."
        badge={<RoleBadge roleType="DEPARTMENT_HEAD" />}
      />

      <InfoBanner
        title="Editable profile fields"
        description="You can update your name and profile picture here. Email, role, and user ID are managed by the system and cannot be changed from this page."
        variant="info"
      />

      <DepartmentHeadProfileSettingsClient
        initialProfile={{
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          suffix: user.suffix,
          hasProfilePicture: Boolean(user.profileImageStoragePath),
          profilePictureUrl,
        }}
      />
    </section>
  );
}
