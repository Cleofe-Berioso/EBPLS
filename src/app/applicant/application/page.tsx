import { ApplicationOptionCard } from "@/components/applicant/application-option-card";
import { PageHeader } from "@/components/ui/page-header";

export default function ApplicantApplicationPage() {
  return (
    <section className="ui-page-stack">
      <PageHeader
        eyebrow="Applicant"
        title="Application Filing"
        description="Select the filing type: New Application, Renewal Application, or Closure Application."
      />

      <div className="grid gap-4 md:grid-cols-3 items-stretch">
        <ApplicationOptionCard
          title="New Application"
          description="Register a new business and submit initial permit requirements."
          href="/applicant/application/new"
        />
        <ApplicationOptionCard
          title="Renewal Application"
          description="Renew an existing business permit with annual requirements."
          href="/applicant/application/renewal"
        />
        <ApplicationOptionCard
          title="Closure Application"
          description="Submit a closure request for a business that will stop operations."
          href="/applicant/application/closure"
        />
      </div>
    </section>
  );
}
