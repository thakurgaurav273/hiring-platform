"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Table building blocks shared by list pages.
 *
 * <TableCard> is a bordered card with three parts: a fixed column header, a
 * body that scrolls, and a fixed footer. The scrollbar only spans the body.
 * Header and body reserve the same scrollbar gutter so columns stay aligned.
 * Inside a height-bounded flex column (see <ListPage>) the card shrinks to its
 * content and never grows past the available space.
 */
export function TableCard({
  header,
  children,
  footer,
  className,
}: {
  /** Column header row; rendered outside the scroll area. */
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card relative flex min-h-0 flex-col overflow-hidden", className)}>
      {header && (
        <div className={cn("shrink-0 overflow-hidden border-b border-border bg-surface-2 [scrollbar-gutter:stable] scrollbar-thin", headerText)}>
          {header}
        </div>
      )}
      {/* relative: makes this the containing block, so absolutely positioned
          children (e.g. sr-only labels) are clipped here instead of stretching the page. */}
      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable] scrollbar-thin">{children}</div>
      {footer && <div className="shrink-0 border-t border-border bg-surface">{footer}</div>}
    </div>
  );
}

/** Text style for column headings. */
export const headerText = "text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground";

/**
 * Page layout for list screens: header, toolbar, then a table that fills the
 * rest of the viewport on large screens so only the table body scrolls.
 * On small screens the page scrolls normally.
 */
export function ListPage({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:h-[calc(100vh-4rem)]">
      <div className="shrink-0">{header}</div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-5 md:px-8">{children}</div>
    </div>
  );
}

export const PAGE_SIZES = [10, 20, 50, 100] as const;

/** Page size remembered per table in localStorage. */
export function usePageSize(key: string, fallback = 20) {
  const storageKey = `rl-page-size:${key}`;
  const [size, setSize] = useState(fallback);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if ((PAGE_SIZES as readonly number[]).includes(saved)) setSize(saved);
    } catch {
      // storage unavailable
    }
  }, [storageKey]);
  const update = (n: number) => {
    setSize(n);
    try {
      localStorage.setItem(storageKey, String(n));
    } catch {
      // storage unavailable
    }
  };
  return [size, update] as const;
}

/** Slice a client-side list for the current page. */
export function paginate<T>(items: T[], page: number, size: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), totalPages);
  return { rows: items.slice((current - 1) * size, current * size), page: current, totalPages, total: items.length };
}

/** Footer: "Rows per page", "21–40 of 57", first/prev/next/last. */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  noun = "rows",
  sizes = PAGE_SIZES,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Plural label for the range, e.g. "jobs". */
  noun?: string;
  sizes?: readonly number[];
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const id = `page-size-${noun.replace(/\s+/g, "-")}`;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 text-[12px] text-muted-foreground", className)}>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="hidden sm:inline">
          Rows per page
        </label>
        <select
          id={id}
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-7 rounded-md border border-border bg-background px-1.5 text-[12px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          aria-label="Rows per page"
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <span className="tabular-nums" aria-live="polite">
          {from}–{to} of {total} {noun}
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" disabled={page <= 1} onClick={() => onPageChange(1)} aria-label="First page">
            <ChevronsLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          <span className="px-1 tabular-nums">
            {page} / {totalPages}
          </span>
          <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
            <ChevronRight />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden sm:inline-flex"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
