import type { ReactNode } from "react";
import type { Role } from "@/constants/enums";

export interface FilterOption {
  value: string;
  label: string;
  /** Custom rendering in the drawer (e.g. a stage badge). Defaults to the label. */
  render?: ReactNode;
}

/** Selected values per field id. Single-select fields hold zero or one value. */
export type FilterValues = Record<string, string[]>;

/** What option builders can read: page data, the signed-in role and the values being edited. */
export interface FilterContext<TData> {
  data: TData;
  role: Role;
  values: FilterValues;
}

interface BaseField<TData> {
  id: string;
  label: string;
  /** Static options, or built from page data and the other fields' current values. */
  options: FilterOption[] | ((ctx: FilterContext<TData>) => FilterOption[]);
  /** Only these roles see the field. Omit for everyone. */
  roles?: Role[];
  /** Show a search box above long option lists. */
  searchable?: boolean;
  /** Message when there are no options. */
  emptyText?: string;
}

export interface MultiSelectField<TData> extends BaseField<TData> {
  type: "multi";
}

export interface SingleSelectField<TData> extends BaseField<TData> {
  type: "single";
  /**
   * A required field always has a value: it falls back to the first option
   * and cannot be cleared (e.g. the job shown on the pipeline board).
   */
  required?: boolean;
  /** Label of the "no filter" choice for optional fields, e.g. "All departments". */
  allLabel?: string;
}

export type FilterField<TData> = MultiSelectField<TData> | SingleSelectField<TData>;

export interface FilterConfig<TData = unknown> {
  /** Drawer title. */
  title: string;
  description?: string;
  fields: FilterField<TData>[];
}
