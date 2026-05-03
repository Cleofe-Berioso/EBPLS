export interface FormStepItem {
  title: string;
  description?: string;
}

interface FormStepperProps {
  steps: Array<string | FormStepItem>;
  currentStep: number;
}

export function FormStepper({ steps, currentStep }: FormStepperProps) {
  const normalizedSteps = steps.map((step) =>
    typeof step === "string" ? { title: step } : step
  );
  const progress = ((currentStep + 1) / normalizedSteps.length) * 100;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
              Application Progress
            </p>
            <p className="text-sm text-slate-600">
              Step {currentStep + 1} of {normalizedSteps.length}:{" "}
              <span className="font-medium text-slate-900">
                {normalizedSteps[currentStep]?.title}
              </span>
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-700">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-green-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {normalizedSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;
          return (
            <li
              key={step.title}
              className={`rounded-2xl border px-4 py-4 text-sm ${
                isActive
                  ? "border-green-200 bg-green-50 text-green-900"
                  : isDone
                    ? "border-green-200 bg-green-50/70 text-green-800"
                    : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-green-600 text-white"
                      : isDone
                        ? "bg-green-700 text-white"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{step.title}</p>
                  {step.description ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
