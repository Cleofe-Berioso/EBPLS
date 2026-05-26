import { RenewalApplicationForm } from "@/components/applicant/renewal-application-form";
import { PageHeader } from "@/components/ui/page-header";

export default function RenewalApplicationPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Applicant"
        title="Renewal Application"
        description="Renew an existing business permit through review, document upload, and final submission."
      />
      <RenewalApplicationForm />
    </section>
  );
}
