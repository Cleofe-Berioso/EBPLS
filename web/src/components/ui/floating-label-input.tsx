"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingLabelInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  error?: string;
  hint?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  inputClassName?: string;
  labelClassName?: string;
}

const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(
  (
    {
      className,
      inputClassName,
      labelClassName,
      label,
      error,
      hint,
      id,
      name,
      required,
      startAdornment,
      endAdornment,
      autoComplete,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    if (!inputId) {
      throw new Error("FloatingLabelInput requires either an id or a name.");
    }

    const hasStartAdornment = Boolean(startAdornment);
    const hasEndAdornment = Boolean(endAdornment);

    return (
      <div className={cn("w-full", className)}>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            required={required}
            autoComplete={autoComplete}
            placeholder=" "
            aria-invalid={error ? "true" : undefined}
            className={cn(
              "peer block w-full rounded-lg border bg-white py-3 text-sm text-gray-900 outline-none transition-all autofill:[box-shadow:inset_0_0_0px_1000px_white] autofill:[-webkit-text-fill-color:#111827]",
              hasStartAdornment ? "pl-10" : "px-4",
              hasEndAdornment ? "pr-11" : "pr-4",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/20",
              inputClassName
            )}
            {...props}
          />

          {startAdornment ? (
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400 transition-colors peer-focus:text-green-600">
              {startAdornment}
            </div>
          ) : null}

          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute rounded-sm bg-white px-1 text-sm text-gray-500 transition-all duration-150",
              hasStartAdornment ? "left-9" : "left-3",
              "top-1/2 -translate-y-1/2",
              "peer-focus:left-3 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-700",
              "peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-gray-700",
              "peer-[-webkit-autofill]:left-3 peer-[-webkit-autofill]:top-0 peer-[-webkit-autofill]:-translate-y-1/2 peer-[-webkit-autofill]:text-xs peer-[-webkit-autofill]:font-medium",
              labelClassName
            )}
          >
            {label}
            {required ? <span className="ml-1 text-red-500">*</span> : null}
          </label>

          {endAdornment ? (
            <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
              {endAdornment}
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
        {hint && !error ? (
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };
