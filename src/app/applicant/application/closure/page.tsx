import { ClosureApplicationForm } from "@/components/applicant/closure-application-form";
import { PageHeader } from "@/components/ui/page-header";

export default function ClosureApplicationPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Applicant"
        title="Closure Application"
        description="Prepare closure requirements, review the settlement preview, and submit the closure request."
      />
      <ClosureApplicationForm />
    </section>
  );
}
