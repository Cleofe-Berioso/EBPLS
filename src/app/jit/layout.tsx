import { notFound } from "next/navigation";
import { signOut } from "@/lib/auth";
import { requireJitSession } from "@/lib/jit-api";
import { JitLayoutClient } from "@/components/jit/jit-layout-client";

export default async function JitLayout({ children }: { children: React.ReactNode }) {
  const session = await requireJitSession();
  if (!session) notFound();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return <JitLayoutClient userName={session.user?.name ?? "JIT"} signOutAction={handleSignOut}>{children}</JitLayoutClient>;
}