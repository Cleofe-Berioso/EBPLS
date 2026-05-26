import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";

export default function BploReportsPage() {
  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="BPLO"
        title="Reports"
        description="Review BPLO reporting summaries for filing volume, processing activity, and released records."
      />
      <InfoBanner
        title="View-only monitoring"
        description="This page is reserved for reporting summaries and does not change any workflow behavior."
        variant="info"
      />
      <EmptyState
        title="No records available yet"
        description="This section will populate as applications move through review, assessment, payment verification, and issuance."
      />
    </section>
  );
}
