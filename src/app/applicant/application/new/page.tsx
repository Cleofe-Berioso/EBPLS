import { NewApplicationForm } from "@/components/applicant/new-application-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewApplicationPage() {
  return (
    <section className="ui-page-stack pb-2">
      <PageHeader
        eyebrow="Applicant"
        title="New Application"
        description="Complete the steps to prepare, review, and submit a new business permit application."
      />
      <NewApplicationForm />
    </section>
  );
}
