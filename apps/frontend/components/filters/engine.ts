import type { Role } from "@/constants/enums";
import type { FilterConfig, FilterField, FilterOption, FilterValues } from "./types";

export interface ResolvedField<TData> {
  field: FilterField<TData>;
  options: FilterOption[];
}

export const isRequired = <TData,>(field: FilterField<TData>) => field.type === "single" && !!field.required;

/** Fields visible to the role. */
export function visibleFields<TData>(config: FilterConfig<TData>, role: Role): FilterField<TData>[] {
  return config.fields.filter((f) => !f.roles || f.roles.includes(role));
}

/**
 * Turns raw values into valid ones for the current data:
 *  - fields the role cannot see are dropped,
 *  - values that are no longer offered are removed (e.g. a job outside the
 *    selected department),
 *  - single-select keeps at most one value,
 *  - required single-select falls back to its first option.
 *
 * Fields are resolved in config order, so a field's options can depend on
 * the already-resolved values of the fields above it.
 */
export function resolveFilters<TData>(
  config: FilterConfig<TData>,
  data: TData,
  role: Role,
  raw: FilterValues
): { values: FilterValues; fields: ResolvedField<TData>[] } {
  const values: FilterValues = {};
  const fields: ResolvedField<TData>[] = [];

  for (const field of visibleFields(config, role)) {
    // Builders only see the resolved values of fields above this one, so a
    // hidden field (or an invalid value) can never narrow another field.
    const options =
      typeof field.options === "function" ? field.options({ data, role, values: { ...values } }) : field.options;
    const allowed = new Set(options.map((o) => o.value));
    let selected = (raw[field.id] ?? []).filter((v) => allowed.has(v));
    if (field.type === "single") selected = selected.slice(0, 1);
    if (isRequired(field) && selected.length === 0 && options[0]) selected = [options[0].value];
    values[field.id] = selected;
    fields.push({ field, options });
  }
  return { values, fields };
}

/** Values with every field cleared (required fields will fall back to their default). */
export const clearedValues = <TData,>(config: FilterConfig<TData>): FilterValues =>
  Object.fromEntries(config.fields.map((f) => [f.id, []]));

/** Number of filters the user has narrowed by. Required fields don't count. */
export function countActive<TData>(fields: ResolvedField<TData>[], values: FilterValues): number {
  return fields.reduce((n, { field }) => n + (isRequired(field) ? 0 : (values[field.id] ?? []).length), 0);
}

/** First value of a single-select field, or undefined. */
export const single = (values: FilterValues, id: string): string | undefined => values[id]?.[0];

/** Values of a multi-select field, or undefined when empty (handy for query params). */
export const multi = (values: FilterValues, id: string): string[] | undefined =>
  values[id]?.length ? values[id] : undefined;
