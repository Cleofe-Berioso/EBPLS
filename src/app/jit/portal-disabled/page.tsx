import { signOut } from "@/lib/auth";

export default async function JitPortalDisabledPage() {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-600 bg-slate-800 p-8 text-center shadow-2xl">
        <div className="mb-4 text-5xl">🔒</div>
        <h1 className="mb-2 text-2xl font-bold text-white">JIT Portal Disabled</h1>
        <p className="mb-6 text-slate-300">
          The JIT Portal is currently disabled by the system administrator. Please contact your administrator for more information.
        </p>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            Return to Login
          </button>
        </form>
      </div>
    </div>
  );
}
