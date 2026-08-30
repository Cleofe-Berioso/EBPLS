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
  const nextStep = normalizedSteps[currentStep + 1];

  return (
    <div className="app-surface space-y-4 p-4 sm:p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Application Progress
            </p>
            <p className="text-sm text-[var(--ink-muted)]">
              Step {currentStep + 1} of {normalizedSteps.length}:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {normalizedSteps[currentStep]?.title}
              </span>
            </p>
          </div>
          <span className="text-sm font-semibold text-[var(--ink-muted)]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--muted-surface)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {nextStep ? (
        <p className="text-sm text-[var(--ink-muted)] lg:hidden">
          Next: <span className="font-medium text-[var(--foreground)]">{nextStep.title}</span>
        </p>
      ) : null}

      <ol className="hidden gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
        {normalizedSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;
          return (
            <li
              key={step.title}
              className={`rounded-[var(--radius-card)] border px-4 py-4 text-sm ${
                isActive
                  ? "border-[var(--border-color)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                  : isDone
                    ? "border-[var(--border-color)] bg-[var(--success-soft)] text-[var(--success)]"
                    : "border-[var(--border-color)] bg-[var(--muted-surface)] text-[var(--ink-muted)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : isDone
                        ? "bg-[var(--primary-strong)] text-white"
                        : "bg-[var(--muted-surface)] text-[var(--ink-muted)]"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{step.title}</p>
                  {step.description ? (
                    <p className="mt-1 ui-caption leading-5">{step.description}</p>
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
