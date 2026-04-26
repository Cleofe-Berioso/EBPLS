import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import { PublicNav } from "@/components/public/public-nav";
import { PublicFooter } from "@/components/public/public-footer";

export const metadata: Metadata = {
  title: "Requirements",
  description: "Complete list of documentary requirements for business permit application in the Philippines.",
};

const requirements = [
  {
    category: "For New Business Permit Application",
    items: [
      { name: "DTI/SEC/CDA Certificate of Registration", description: "Original and photocopy" },
      { name: "Barangay Business Clearance", description: "From the barangay where the business is located" },
      { name: "Locational Clearance / Zoning Certificate", description: "From the City/Municipal Planning and Development Office" },
      { name: "Contract of Lease / Land Title", description: "If renting, submit notarized contract of lease; if owned, submit land title" },
      { name: "Community Tax Certificate (Cedula)", description: "Current year" },
      { name: "Public Liability Insurance", description: "For businesses with public access" },
      { name: "Fire Safety Inspection Certificate", description: "From the Bureau of Fire Protection (BFP)" },
      { name: "Sanitary Permit", description: "From the City/Municipal Health Office" },
      { name: "Environmental Compliance Certificate", description: "If applicable, from DENR" },
      { name: "SSS/PhilHealth/Pag-IBIG Employer Registration", description: "If with employees" },
      { name: "Valid Government-Issued ID", description: "Of the business owner/authorized representative" },
      { name: "2x2 ID Photo", description: "Recent photo of the business owner" },
    ],
  },
  {
    category: "For Business Permit Renewal",
    items: [
      { name: "Previous Year Business Permit", description: "Original and photocopy" },
      { name: "Barangay Business Clearance", description: "Current year" },
      { name: "Community Tax Certificate (Cedula)", description: "Current year" },
      { name: "Fire Safety Inspection Certificate", description: "Current year" },
      { name: "Sanitary Permit", description: "Current year renewal" },
      { name: "Financial Statement / ITR", description: "Audited or sworn statement for the previous year" },
      { name: "Updated SSS/PhilHealth/Pag-IBIG Records", description: "If with employees" },
      { name: "Public Liability Insurance", description: "If applicable, renewed policy" },
    ],
  },
  {
    category: "Additional Requirements (If Applicable)",
    items: [
      { name: "Occupational Permit", description: "For regulated professions" },
      { name: "FDA License", description: "For food and drug-related businesses" },
      { name: "DOT Accreditation", description: "For tourism-related businesses" },
      { name: "DENR ECC", description: "For environmentally critical projects" },
      { name: "Special Permits", description: "Depending on business nature (e.g., liquor license, firearms)" },
    ],
  },
];

export default function RequirementsPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-muted)]">
      <PublicNav />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            Documentary Requirements
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Please prepare the following documents before submitting your
            application. All uploads must be clear, legible, PDF/JPEG/PNG format
            (max 10 MB each).
          </p>
        </div>

        {/* Requirements Cards */}
        <div className="space-y-6">
          {requirements.map((section) => (
            <div
              key={section.category}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] sm:text-lg">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                {section.category}
              </h2>
              <ol className="space-y-3">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl bg-[var(--surface-muted)] p-3"
                  >
                    <span className="mt-0.5 flex-shrink-0 text-sm font-bold text-[var(--accent-hover)]">
                      {i + 1}.
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Reminders */}
        <div className="mt-8 rounded-2xl border border-blue-200 bg-[var(--accent-light)] p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-[var(--accent)]" />
            <h3 className="font-semibold text-blue-900">Important Reminders</h3>
          </div>
          <ul className="space-y-1.5 text-sm text-blue-800">
            {[
              "Ensure all documents are valid and not expired",
              "Scanned documents should be clear and fully readable",
              "File size per document must not exceed 10 MB",
              "Accepted formats: PDF, JPEG, PNG, WebP",
              "Incomplete documents may delay your application",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent-light)]0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] sm:w-auto"
          >
            Start Your Application
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/how-to-apply"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] sm:w-auto"
          >
            How to Apply
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
