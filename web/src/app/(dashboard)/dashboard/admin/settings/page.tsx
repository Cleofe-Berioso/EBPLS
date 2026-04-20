import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminSettingsClient } from "@/components/dashboard/admin-settings-client";

export const metadata = { title: "System Settings" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "BPLO_OFFICE") redirect("/dashboard");

  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });

  return (
    <AdminSettingsClient
      initialSettings={JSON.parse(JSON.stringify(settings))}
      nodeVersion={process.version}
    />
  );
}
