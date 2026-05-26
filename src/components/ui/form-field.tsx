import type { ReactNode } from "react";

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2" htmlFor={htmlFor}>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 sm:text-base">
        {label}
        {required ? <span className="text-red-600">*</span> : null}
      </span>
      <div>{children}</div>
      {error ? <p className="text-xs sm:text-sm font-medium text-rose-700">{error}</p> : null}
      {!error && hint ? <p className="text-xs sm:text-sm leading-5 text-slate-500">{hint}</p> : null}
    </label>
  );
}
