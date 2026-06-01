import { ClosureApplicationForm } from "@/components/applicant/closure-application-form";
import { PageHeader } from "@/components/ui/page-header";

export default function ClosureApplicationPage() {
  return (
    <section className="space-y-6 pb-4">
      <PageHeader
        eyebrow="Applicant"
        title="Closure Application"
        description="Prepare closure requirements and submit the closure request for BPLO and MTO assessment."
      />
      <ClosureApplicationForm />
    </section>
  );
}
