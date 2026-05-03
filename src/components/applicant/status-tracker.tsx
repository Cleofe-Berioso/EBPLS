import type { ApplicationStatus } from "@/lib/applicant-types";
import { DISPLAY_STATUS_FLOW, getStatusBanner, getTrackerIndex } from "@/components/ui/status-badge";
import { InfoBanner } from "@/components/ui/info-banner";

export function StatusTracker({ status }: { status: ApplicationStatus }) {
  const currentIndex = getTrackerIndex(status);
  const banner = getStatusBanner(status);

  return (
    <div className="space-y-3">
      {banner ? (
        <InfoBanner
          title={banner.title}
          description={banner.description}
          variant={banner.variant}
        />
      ) : null}
      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {DISPLAY_STATUS_FLOW.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={step}
              className={`rounded-2xl border px-4 py-4 text-sm ${
                active
                  ? "border-green-200 bg-green-50 text-green-900"
                  : done
                    ? "border-green-200 bg-green-50/70 text-green-800"
                    : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <span
                className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-green-700 text-white"
                    : done
                      ? "bg-green-100 text-green-800"
                      : "bg-white text-slate-700"
                }`}
              >
                {index + 1}
              </span>
              <p className="font-medium">{step}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
