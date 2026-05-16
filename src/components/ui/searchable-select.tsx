"use client";

import { useEffect, useMemo, useRef, useState, useId, type KeyboardEvent } from "react";

import type { AddressOption } from "@/lib/address-types";

interface SearchableSelectProps {
  options: AddressOption[];
  value: string;
  selectedLabel?: string;
  onChange: (option: AddressOption) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
}

/**
 * Searchable dropdown that looks like a native select.
 * - Click trigger to open panel.
 * - Type to filter options.
 * - Click option or press Enter to select.
 * - Press Escape or click outside to close.
 * - Keyboard: ArrowUp/ArrowDown to navigate highlighted option.
 */
export function SearchableSelect({
  options,
  value,
  selectedLabel,
  onChange,
  placeholder = "Select…",
  emptyMessage = "No matches.",
  disabled = false,
  loading = false,
  error,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const errorId = `searchable-select-error-${useId()}`;

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(normalizedQuery) || option.value.toLowerCase().includes(normalizedQuery)
    );
  }, [options, query]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus search input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  function handleTriggerClick() {
    if (disabled) return;
    setOpen((prev) => !prev);
    setQuery("");
  }

  function selectOption(option: AddressOption) {
    onChange(option);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = filtered[highlightIndex];
      if (chosen) selectOption(chosen);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  const displayLabel = selectedLabel ?? options.find((option) => option.value === value)?.label ?? "";
  const triggerBase =
    "w-full rounded-xl border px-3 py-3 text-sm text-left flex items-center justify-between transition-colors";
  const triggerEnabled =
    "border-slate-300 bg-white text-slate-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 cursor-pointer";
  const triggerDisabled =
    "border-slate-300 bg-slate-100 text-slate-800 shadow-inner cursor-not-allowed";
  const triggerError = error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100" : "";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled || loading}
        className={`${triggerBase} ${disabled || loading ? triggerDisabled : triggerEnabled} ${triggerError}`}
        onClick={handleTriggerClick}
      >
        <span className={displayLabel ? "text-slate-900" : "text-slate-400"}>
          {loading ? "Loading…" : displayLabel || placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200"
            />
          </div>

          {error ? <div id={errorId} className="px-3 py-2 text-sm text-rose-700">{error}</div> : null}

          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {loading ? (
              <li className="px-3 py-2 text-sm text-slate-500">Loading…</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm italic text-slate-400">{emptyMessage}</li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur before click registers
                    onChange(option);
                    setOpen(false);
                    setQuery("");
                  }}
                  onMouseEnter={() => setHighlightIndex(index)}
                  className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                    index === highlightIndex
                      ? "bg-green-50 text-green-800"
                      : option.value === value
                        ? "bg-slate-50 font-medium text-slate-900"
                        : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
