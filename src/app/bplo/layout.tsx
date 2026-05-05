import { notFound } from "next/navigation";
import { signOut } from "@/lib/auth";
import { requireBploSession } from "@/lib/bplo-api";
import { BploLayoutClient } from "@/components/bplo/bplo-layout-client";

export default async function BploLayout({ children }: { children: React.ReactNode }) {
  const session = await requireBploSession();
  if (!session) notFound();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <BploLayoutClient userName={session.user?.name ?? "BPLO"} signOutAction={handleSignOut}>
      {children}
    </BploLayoutClient>
  );
}
