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
    <label className="block space-y-2 text-sm" htmlFor={htmlFor}>
      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
        {label}
        {required ? <span className="text-red-600">*</span> : null}
      </span>
      <div>{children}</div>
      {error ? <p className="text-xs font-medium text-rose-700">{error}</p> : null}
      {!error && hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </label>
  );
}
