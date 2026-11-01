"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact search field used at the top of list pages. Search and filters sit
 * on one line with no surrounding card; applied-filter chips wrap below.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accessible name, e.g. "Search candidates". */
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:w-auto sm:min-w-[260px] sm:max-w-sm sm:flex-1", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        className="h-9 w-full rounded-[var(--radius-control,0.5rem)] border border-transparent bg-secondary/70 pl-8 pr-8 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground hover:bg-secondary focus:border-ring/50 focus:bg-background focus:ring-2 focus:ring-ring/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * One-line toolbar: search on the left, filters/actions next to it, an
 * optional summary (e.g. "12 roles") pushed to the right.
 */
export function ListToolbar({
  search,
  children,
  summary,
  className,
}: {
  search?: React.ReactNode;
  /** Filters button, extra controls. Filter chips wrap onto their own row. */
  children?: React.ReactNode;
  summary?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {search}
      {children}
      {summary !== undefined && (
        <div className="order-first w-full text-[12px] text-muted-foreground sm:order-none sm:ml-auto sm:w-auto" aria-live="polite">
          {summary}
        </div>
      )}
    </div>
  );
}
