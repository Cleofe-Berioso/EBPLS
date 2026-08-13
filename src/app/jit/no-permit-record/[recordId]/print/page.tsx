import Link from "next/link";
import { notFound } from "next/navigation";
import { NoPermitNoticeTemplate } from "@/components/print/no-permit-notice-template";
import { actionButtonStyles } from "@/components/ui/action-button";
import { requireJitSession } from "@/lib/jit-api";
import { getJitNoPermitNoticePrintAccess } from "@/lib/jit-no-permit-ticket";

interface PageProps {
  params: Promise<{ recordId: string }>;
}

export default async function JitNoPermitNoticePrintPage({ params }: PageProps) {
  const session = await requireJitSession();
  if (!session?.user?.id) notFound();

  const { recordId } = await params;
  const access = await getJitNoPermitNoticePrintAccess(recordId, session.user.id);

  if (!access.ok) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="no-print flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Read-only no-permit notice print view. Use Print Notice to generate a browser printout.
        </p>
        <Link href="/jit/no-permit-record" className={actionButtonStyles("secondary", "sm")}>
          Back to No Permit Records
        </Link>
      </div>
      <NoPermitNoticeTemplate notice={access.notice} />
    </section>
  );
}
