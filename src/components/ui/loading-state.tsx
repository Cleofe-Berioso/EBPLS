type LoadingStateProps = {
  message?: string;
  compact?: boolean;
  className?: string;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function LoadingState({
  message = "Loading…",
  compact = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={joinClasses(
        "ui-loading-state",
        compact && "ui-loading-state--compact",
        className
      )}
    >
      <span className="ui-loading-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
