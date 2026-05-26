import { notFound } from "next/navigation";
import { signOut } from "@/lib/auth";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";
import { DepartmentHeadLayoutClient } from "@/components/department-head/department-head-layout-client";

export default async function DepartmentHeadLayout({ children }: { children: React.ReactNode }) {
  const session = await requireDepartmentHeadSession();
  if (!session) notFound();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <DepartmentHeadLayoutClient userName={session.user?.name ?? "Department Head"} signOutAction={handleSignOut}>
      {children}
    </DepartmentHeadLayoutClient>
  );
}