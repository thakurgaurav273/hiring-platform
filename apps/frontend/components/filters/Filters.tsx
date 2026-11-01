"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { Drawer } from "@/components/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { clearedValues, countActive, isRequired, resolveFilters, type ResolvedField } from "./engine";
import type { FilterConfig, FilterOption, FilterValues } from "./types";

/** Radio value for the "no filter" choice of an optional single-select field. */
const ALL = "__all__";

/** Resolves raw filter state into valid values for the current data and role. */
export function useResolvedFilters<TData>(config: FilterConfig<TData>, data: TData, raw: FilterValues) {
  const role = useAppStore((s) => s.role);
  return useMemo(() => resolveFilters(config, data, role, raw), [config, data, role, raw]);
}

/**
 * The platform's filter control: a "Filters" button that opens a right-side
 * drawer rendered from `config`, plus chips for the applied filters.
 *
 * Changes are drafted in the drawer and only reach `onChange` on Apply.
 * `onChange` receives resolved values (invalid or hidden selections removed).
 */
export function Filters<TData>({
  config,
  data,
  value,
  onChange,
  showChips = true,
  className,
}: {
  config: FilterConfig<TData>;
  data: TData;
  value: FilterValues;
  onChange: (value: FilterValues) => void;
  showChips?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const applied = useResolvedFilters(config, data, value);
  const count = countActive(applied.fields, applied.values);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className={cn("h-9 gap-2 bg-surface", className)} aria-haspopup="dialog">
        <SlidersHorizontal className="size-4" />
        Filters
        {count > 0 && (
          <Badge className="h-5 min-w-5 rounded-full px-1.5 tabular-nums" aria-label={`${count} applied`}>
            {count}
          </Badge>
        )}
      </Button>

      <FilterDrawer config={config} data={data} open={open} onOpenChange={setOpen} value={applied.values} onApply={onChange} />

      {showChips && <AppliedFilterChips fields={applied.fields} values={applied.values} onChange={onChange} config={config} />}
    </>
  );
}

/** Chips for applied filters. Rendered by <Filters>; use directly to place chips elsewhere. */
export function AppliedFilterChips<TData>({
  config,
  fields,
  values,
  onChange,
}: {
  config: FilterConfig<TData>;
  fields: ResolvedField<TData>[];
  values: FilterValues;
  onChange: (value: FilterValues) => void;
}) {
  const chips = fields.flatMap(({ field, options }) =>
    (values[field.id] ?? []).map((v) => ({
      field,
      value: v,
      label: options.find((o) => o.value === v)?.label ?? v,
      removable: !isRequired(field),
    }))
  );
  if (!chips.some((c) => c.removable)) return null;

  return (
    <div className="flex basis-full flex-wrap items-center gap-2" aria-label="Applied filters">
      {chips.map((c) => (
        <Badge
          key={`${c.field.id}:${c.value}`}
          variant="outline"
          className={cn("h-7 gap-1.5 rounded-full bg-surface pl-2.5 text-[12px] font-normal", c.removable ? "pr-1" : "pr-2.5")}
        >
          <span className="text-muted-foreground">{c.field.label}:</span>
          <span className="max-w-[200px] truncate font-medium">{c.label}</span>
          {c.removable && (
            <button
              type="button"
              onClick={() => onChange({ ...values, [c.field.id]: values[c.field.id].filter((x) => x !== c.value) })}
              className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={`Remove ${c.field.label} filter: ${c.label}`}
            >
              <X className="size-3" />
            </button>
          )}
        </Badge>
      ))}
      <Button variant="link" size="sm" className="h-7 px-1 text-[12px] text-muted-foreground" onClick={() => onChange(clearedValues(config))}>
        Clear all
      </Button>
    </div>
  );
}

function FilterDrawer<TData>({
  config,
  data,
  open,
  onOpenChange,
  value,
  onApply,
}: {
  config: FilterConfig<TData>;
  data: TData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FilterValues;
  onApply: (value: FilterValues) => void;
}) {
  const [draft, setDraft] = useState<FilterValues>(value);

  // Start from the applied filters each time the drawer opens.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) setDraft(value);
    wasOpen.current = open;
  }, [open, value]);

  const { values, fields } = useResolvedFilters(config, data, draft);
  const draftCount = countActive(fields, values);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={config.title}
      description={config.description}
      footer={
        <>
          <Button variant="ghost" onClick={() => setDraft(clearedValues(config))} disabled={draftCount === 0} className="text-muted-foreground">
            Clear filters
          </Button>
          <Button
            className="ml-auto min-w-32 hover:bg-primary-hover"
            onClick={() => {
              onApply(values);
              onOpenChange(false);
            }}
          >
            Apply{draftCount > 0 ? ` (${draftCount})` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {fields.map(({ field, options }, i) => (
          <div key={field.id}>
            {i > 0 && <Separator className="mb-6" />}
            <FieldSection
              id={field.id}
              label={field.label}
              type={field.type}
              required={isRequired(field)}
              allLabel={field.type === "single" ? field.allLabel : undefined}
              searchable={field.searchable}
              emptyText={field.emptyText}
              options={options}
              selected={values[field.id] ?? []}
              onChange={(update) => setDraft((d) => ({ ...d, [field.id]: update(d[field.id] ?? []) }))}
            />
          </div>
        ))}
      </div>
    </Drawer>
  );
}

function FieldSection({
  id,
  label,
  type,
  required,
  allLabel,
  searchable,
  emptyText,
  options,
  selected,
  onChange,
}: {
  id: string;
  label: string;
  type: "multi" | "single";
  required: boolean;
  allLabel?: string;
  searchable?: boolean;
  emptyText?: string;
  options: FilterOption[];
  selected: string[];
  /** Receives an updater so rapid consecutive clicks never use a stale selection. */
  onChange: (update: (current: string[]) => string[]) => void;
}) {
  const [q, setQ] = useState("");
  const shown = useMemo(
    () => (q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options),
    [options, q]
  );
  const headingId = `filter-${id}`;
  const count = required ? 0 : selected.length;

  return (
    <fieldset aria-labelledby={headingId}>
      <div className="mb-3 flex items-center justify-between">
        <legend id={headingId} className="flex items-center gap-2 text-[13px] font-semibold">
          {label}
          {type === "multi" && count > 0 && (
            <Badge variant="secondary" className="h-5 rounded-full px-1.5 tabular-nums">
              {count}
            </Badge>
          )}
        </legend>
        {count > 0 && (
          <button type="button" onClick={() => onChange(() => [])} className="text-[12px] font-medium text-muted-foreground hover:text-foreground">
            Clear
          </button>
        )}
      </div>

      {searchable && options.length > 6 && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}…`}
            className="h-8 pl-8"
            aria-label={`Search ${label}`}
          />
        </div>
      )}

      {options.length === 0 ? (
        <p className="py-2 text-[12.5px] text-muted-foreground">{emptyText ?? "No options available."}</p>
      ) : shown.length === 0 ? (
        <p className="py-2 text-[12.5px] text-muted-foreground">No matches.</p>
      ) : type === "multi" ? (
        <div className="-mx-2 space-y-0.5">
          {shown.map((o) => {
            const optionId = `${headingId}-${o.value}`;
            const checked = selected.includes(o.value);
            return (
              <label
                key={o.value}
                htmlFor={optionId}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-[13px] transition-colors hover:bg-secondary",
                  checked && "bg-secondary/60"
                )}
              >
                <Checkbox
                  id={optionId}
                  checked={checked}
                  onCheckedChange={(next) =>
                    onChange((cur) => (next === true ? [...cur.filter((x) => x !== o.value), o.value] : cur.filter((x) => x !== o.value)))
                  }
                />
                <span className="min-w-0 flex-1 truncate">{o.render ?? o.label}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <RadioGroup
          value={selected[0] ?? ALL}
          onValueChange={(v) => onChange(() => (v === ALL ? [] : [v]))}
          className="-mx-2 gap-0.5"
          aria-labelledby={headingId}
        >
          {!required && !q && (
            <RadioRow id={`${headingId}-all`} value={ALL} label={allLabel ?? "Any"} checked={selected.length === 0} />
          )}
          {shown.map((o) => (
            <RadioRow
              key={o.value}
              id={`${headingId}-${o.value}`}
              value={o.value}
              label={o.render ?? o.label}
              checked={selected[0] === o.value}
            />
          ))}
        </RadioGroup>
      )}
    </fieldset>
  );
}

function RadioRow({ id, value, label, checked }: { id: string; value: string; label: React.ReactNode; checked: boolean }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-[13px] transition-colors hover:bg-secondary",
        checked && "bg-secondary/60"
      )}
    >
      <RadioGroupItem id={id} value={value} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </label>
  );
}
